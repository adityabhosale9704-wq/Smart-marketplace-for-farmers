import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const server = await createServer({ server: { middlewareMode: true } })
const originalWindow = globalThis.window

try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { cartReducer, validateSelections } = await load('utils/cart.ts')
  const { readCart, writeCart, CART_STORAGE_KEY } = await load('utils/cartStorage.ts')
  const { mockProducts } = await load('data/mockProducts.ts')
  const { readProductNavigationState, emptyFilters, filterProducts } = await load('services/filterProducts.ts')
  const navigation = { returnTo: '/marketplace?category=fruits', filters: { ...emptyFilters }, sort: 'name-asc' }
  assert.deepEqual(readProductNavigationState(navigation), navigation)
  for (const value of [null, 4, {}, { ...navigation, returnTo: 4 },
    { ...navigation, returnTo: '/marketplace-invalid' }, { ...navigation, sort: 'unknown' },
    { ...navigation, filters: { ...emptyFilters, search: 4 } },
    { ...navigation, filters: { ...emptyFilters, category: 'invalid' } }]) {
    assert.equal(readProductNavigationState(value), null)
  }
  const matches = filterProducts(mockProducts, { ...emptyFilters, search: '  TOMATOES  ' }, 'name-asc')
  assert.ok(matches.length > 0)
  assert.ok(matches.every(product => product.name.toLowerCase().includes('tomatoes')))
  assert.deepEqual(filterProducts(mockProducts, { ...emptyFilters, minPrice: '100', maxPrice: '10' }, 'name-asc'), [])

  const { default: Provider } = await load('context/CartContext.tsx')
  const { useCart } = await load('hooks/useCart.ts')
  const { default: Cart } = await load('pages/Cart.tsx')
  const { default: Home } = await load('pages/Home.tsx')
  const { default: Marketplace } = await load('pages/Marketplace.tsx')
  const { default: Details } = await load('pages/ProductDetails.tsx')

  let state = { items: [], message: '' }
  const dispatch = action => { state = cartReducer(state, action) }
  dispatch({ type: 'add', productId: 'tomatoes', quantity: 2 })
  assert.deepEqual(state.items, [{ productId: 'tomatoes', quantity: 2 }])
  dispatch({ type: 'add', productId: 'rice', quantity: 1 })
  dispatch({ type: 'add', productId: 'tomatoes', quantity: 3 })
  assert.equal(state.items.length, 2)
  assert.equal(state.items[0].quantity, 5)
  dispatch({ type: 'update', productId: 'tomatoes', quantity: 6 })
  dispatch({ type: 'update', productId: 'tomatoes', quantity: 4 })
  assert.equal(state.items[0].quantity, 4)
  for (const quantity of [0, -1, 1.5, NaN, Infinity, Number.MAX_VALUE]) {
    dispatch({ type: 'add', productId: 'tomatoes', quantity })
    dispatch({ type: 'update', productId: 'tomatoes', quantity })
    assert.equal(state.items[0].quantity, 4)
  }
  dispatch({ type: 'add', productId: 'tomatoes', quantity: Number.MAX_SAFE_INTEGER })
  assert.equal(state.items[0].quantity, 250)
  assert.match(state.message, /Stock limit/)
  for (let index = 0; index < 100; index++) dispatch({ type: 'add', productId: 'tomatoes', quantity: 1 })
  assert.equal(state.items[0].quantity, 250)
  dispatch({ type: 'update', productId: 'rice', quantity: 999 })
  assert.equal(state.items[1].quantity, 20)
  dispatch({ type: 'add', productId: 'missing', quantity: 1 })
  assert.equal(state.items.length, 2)

  const originalStock = mockProducts[0].availableQuantity
  try {
    mockProducts[0].availableQuantity = 0
    dispatch({ type: 'add', productId: 'tomatoes', quantity: 1 })
    assert.ok(!state.items.some(item => item.productId === 'tomatoes'))
    assert.deepEqual(validateSelections([{ productId: 'tomatoes', quantity: 1 }]), [])
  } finally { mockProducts[0].availableQuantity = originalStock }

  dispatch({ type: 'remove', productId: 'rice' })
  assert.equal(state.items.length, 0)
  dispatch({ type: 'clear' })
  assert.deepEqual(state.items, [])
  assert.deepEqual(validateSelections([
    null, {}, { productId: 'missing', quantity: 2 },
    { productId: 'rice', quantity: '2' }, { productId: 'rice', quantity: -1 },
    { productId: 'tomatoes', quantity: 200, price: 0 },
    { productId: 'tomatoes', quantity: 200 },
  ]), [{ productId: 'tomatoes', quantity: 250 }])

  const memory = new Map()
  globalThis.window = { localStorage: {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  } }
  assert.deepEqual(readCart().items, [])
  for (const invalid of ['{bad json', '{}', 'null', '"old-format"', '[{"productId":"gone","quantity":2}]']) {
    memory.set(CART_STORAGE_KEY, invalid)
    assert.deepEqual(readCart().items, [])
  }
  const selections = [{ productId: 'tomatoes', quantity: 3 }, { productId: 'rice', quantity: 2 }]
  assert.equal(writeCart(selections), true)
  assert.deepEqual(JSON.parse(memory.get(CART_STORAGE_KEY)), selections)
  assert.deepEqual(readCart().items, selections)

  let snapshot
  function Probe() {
    snapshot = useCart()
    return null
  }
  const render = (component, url = '/') => renderToStaticMarkup(createElement(Provider, null,
    createElement(MemoryRouter, { initialEntries: [url] },
      createElement(component), createElement(Probe))))
  const full = render(Cart, '/cart')
  assert.equal(snapshot.totalItemCount, 5)
  assert.equal(snapshot.estimatedSubtotal, 3 * 32 + 2 * 6800)
  assert.match(full, /Shopping Cart/)
  assert.match(full, /5 selected listed units/)
  assert.match(full, /href="\/checkout"/)
  assert.match(full, /Fresh Red Tomatoes/)
  assert.match(full, /Premium Basmati Rice/)
  const labelIds = [...full.matchAll(/id="([^"]+)" class="text-sm font-semibold">Selected quantity/g)].map(match => match[1])
  assert.equal(labelIds.length, 2)
  assert.equal(new Set(labelIds).size, 2)
  assert.match(render(Home), /Fresh From the Farm/)
  assert.match(render(Marketplace, '/marketplace'), /Explore the marketplace/)
  const renderDetails = path => renderToStaticMarkup(createElement(Provider, null,
    createElement(MemoryRouter, { initialEntries: [path] },
      createElement(Routes, null, createElement(Route, { path: '/products/:productId', element: createElement(Details) })))))
  assert.match(renderDetails('/products/tomatoes'), /Add to Cart/)
  assert.match(renderDetails('/products/invalid'), /Product Not Found/)
  assert.match(render(Marketplace, { pathname: '/marketplace', state: { filters: { search: 42 } } }), /Explore the marketplace/)
  assert.match(renderDetails({ pathname: '/products/tomatoes', state: { returnTo: 42 } }), /Add to Cart/)

  memory.clear()
  assert.match(render(Cart, '/cart'), /Your cart is empty/)
  assert.equal(snapshot.totalItemCount, 0)
  assert.equal(snapshot.estimatedSubtotal, 0)

  globalThis.window = { get localStorage() { throw new Error('blocked') } }
  assert.equal(readCart().storageWarning, true)
  assert.equal(writeCart(selections), false)
  assert.match(render(Cart, '/cart'), /Browser storage is unavailable/)
  globalThis.window = { localStorage: { getItem: () => null, setItem() { throw new Error('quota') } } }
  assert.equal(writeCart(selections), false)

  console.log('PASS: add/merge, rapid sequential actions, quantity changes, limits, invalid numbers, zero stock, stale IDs, remove/clear, minimal storage round-trip, malformed/blocked storage, provider totals, badge, unique quantity labels, populated/empty Cart, Home, Marketplace, and Product Details rendering.')
  console.log('Manual browser checks remain: clicks and live badge updates, actual refresh persistence, image-error handling, and responsive visual layout.')
} finally {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
  await server.close()
}
