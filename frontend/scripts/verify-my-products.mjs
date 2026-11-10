import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const user = { id: 'product-owner', email: 'seller@example.test' }
let accessToken = 'fixture-seller-access-token'
const originalFetch = globalThis.fetch
const originalClient = globalThis.__sellerClientFixture
globalThis.__sellerClientFixture = {
  auth: {
    async getSession() {
      return { data: { session: { user, access_token: accessToken } }, error: null }
    },
  },
}
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  plugins: [
    {
      name: 'mock-seller-client',
      enforce: 'pre',
      load(id) {
        if (id.replaceAll('\\', '/').endsWith('/src/services/supabase.ts'))
          return 'export default globalThis.__sellerClientFixture'
      },
    },
  ],
})
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { mockSellerListings } = await load('data/mockSellerData.ts')
  const { mockProducts } = await load('data/mockProducts.ts')
  const {
    sellerProductStatus,
    sellerListingCounts,
    filterSellerProducts,
    sellerEditValues,
    validateSellerEdit,
    applySellerEdit,
  } = await load('utils/sellerProductUtils.ts')
  const { default: Page } = await load('pages/seller/MyProducts.tsx')
  const { default: Table } = await load('components/seller/ProductTable.tsx')
  const { default: Editor } = await load('components/seller/EditProductPanel.tsx')
  const { default: Filters } = await load('components/seller/ProductFilters.tsx')
  const { CartContext } = await load('context/cartContextValue.ts')
  const originalSeeds = JSON.stringify(mockSellerListings)
  const originalMarketplace = JSON.stringify(mockProducts)
  const listings = mockSellerListings.map(item => ({ ...item }))
  const empty = { search: '', category: '', status: '' }
  assert.equal(filterSellerProducts(listings, empty).length, 5)
  assert.equal(
    filterSellerProducts(listings, { ...empty, search: '  RED   TOMATOES  ' })[0].id,
    'demo-farm-tomatoes',
  )
  assert.equal(
    filterSellerProducts(listings, { ...empty, category: 'vegetables', status: 'Active' }).length,
    2,
  )
  assert.equal(filterSellerProducts(listings, { ...empty, status: 'Draft' }).length, 1)
  assert.equal(
    filterSellerProducts(listings, { ...empty, status: 'Out of Stock' })[0].name,
    'Golden Wheat',
  )
  assert.equal(filterSellerProducts(listings, { ...empty, category: 'fruits' }).length, 0)
  assert.deepEqual(sellerListingCounts(listings), { total: 5, active: 3, draft: 1, outOfStock: 1 })
  assert.deepEqual(sellerListingCounts([]), { total: 0, active: 0, draft: 0, outOfStock: 0 })
  const values = sellerEditValues(listings[0])
  assert.deepEqual(validateSellerEdit(values), {})
  for (const price of ['', '-1', '0', 'NaN', 'Infinity', '1000001', '1e8', '1.111'])
    assert.ok(validateSellerEdit({ ...values, price }).price)
  for (const stock of ['', '-1', 'NaN', 'Infinity', '1000001', '1.111'])
    assert.ok(validateSellerEdit({ ...values, stock }).stock)
  assert.ok(validateSellerEdit({ ...values, name: ' ' }).name)
  assert.ok(validateSellerEdit({ ...values, name: 'x'.repeat(101) }).name)
  assert.ok(validateSellerEdit({ ...values, status: 'unknown' }).status)
  assert.ok(validateSellerEdit({ ...values, stock: '0', status: 'Active' }).status)
  assert.ok(validateSellerEdit({ ...values, stock: '2', status: 'Out of Stock' }).status)
  assert.deepEqual(validateSellerEdit({ ...values, stock: '0', status: 'Draft' }), {})
  const edited = applySellerEdit(listings[0], {
    name: '  New   Tomatoes ',
    price: '42.50',
    stock: '0',
    status: 'Out of Stock',
  })
  assert.equal(edited.name, 'New Tomatoes')
  assert.equal(edited.price, 42.5)
  assert.equal(edited.unit, listings[0].unit)
  assert.equal(edited.id, listings[0].id)
  assert.equal(edited.category, listings[0].category)
  assert.equal(sellerProductStatus(edited), 'Out of Stock')
  const updated = listings.map(item => (item.id === edited.id ? edited : item))
  assert.deepEqual(sellerListingCounts(updated), { total: 5, active: 2, draft: 1, outOfStock: 2 })
  assert.equal(filterSellerProducts(updated, { ...empty, status: 'Out of Stock' }).length, 2)
  const draft = applySellerEdit(edited, { ...values, stock: '0', status: 'Draft' })
  assert.equal(sellerProductStatus(draft), 'Draft')
  const active = applySellerEdit(edited, { ...values, stock: '2.25', status: 'Active' })
  assert.equal(active.availableQuantity, 2.25)
  assert.equal(sellerProductStatus(active), 'Active')
  assert.equal(applySellerEdit(listings[0], { ...values, price: '-1' }), listings[0])
  assert.equal(JSON.stringify(mockSellerListings), originalSeeds)
  assert.equal(JSON.stringify(mockProducts), originalMarketplace)

  const context = {
    cartItems: [],
    totalItemCount: 0,
    estimatedSubtotal: 0,
    message: '',
    storageWarning: false,
    addItem() {},
    removeItem() {},
    updateQuantity() {},
    clearCart() {},
  }
  const render = element =>
    renderToStaticMarkup(
      createElement(
        CartContext.Provider,
        { value: context },
        createElement(MemoryRouter, { initialEntries: ['/seller/products'] }, element),
      ),
    )
  const html = render(createElement(Page))
  for (const text of [
    'My Products',
    'href="/seller/products"',
    'href="/seller/add-product"',
    'log in',
  ])
    assert.ok(html.includes(text), text)
  assert.ok(!html.includes('Red Tomatoes'))
  const { AuthContext } = await load('context/authContextValue.ts')
  const loading = render(
    createElement(
      AuthContext.Provider,
      {
        value: {
          session: { user: { id: 'seller', email: 'seller@example.test' }, accessToken: 'fixture' },
          checking: false,
          async signOut() {},
        },
      },
      createElement(Page),
    ),
  )
  assert.match(loading, /Loading your products/)
  assert.ok(
    render(createElement(Table, { listings: [], onEdit() {}, onClear() {} })).includes(
      'No products found',
    ),
  )
  assert.ok(
    render(createElement(Editor, { listing: edited, onApply() {}, onCancel() {} })).includes(
      'Save Changes',
    ),
  )
  assert.ok(
    render(createElement(Filters, { filters: empty, onChange() {}, onClear() {} })).includes(
      'Clear Filters',
    ),
  )
  for (const path of ['pages/seller/MyProducts.tsx', 'components/seller/EditProductPanel.tsx']) {
    const source = await readFile(new URL('../src/' + path, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|fetch\(|console\./.test(source))
  }
  assert.ok(
    (await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')).includes(
      'path="/seller/products"',
    ),
  )
  const { getMyProducts, createProduct, updateProduct } = await load('services/products.ts')
  const productValues = {
    name: 'Stored Tomatoes',
    category: 'vegetables',
    description: 'Freshly harvested tomatoes from our farm.',
    price: '32.50',
    stock: '125.25',
    unit: 'kg',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    harvestDate: '',
  }
  const row = {
    id: '00000000-0000-4000-8000-000000000001',
    seller_id: user.id,
    name: productValues.name,
    category: 'vegetables',
    price: 32.5,
    available_quantity: 125.25,
    unit: 'kg',
    listing_status: 'draft',
    image_path: null,
  }
  const calls = []
  const reply = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    assert.equal(options.headers.Authorization, `Bearer ${accessToken}`)
    if (String(url).endsWith('/api/auth/me')) return reply(user)
    if (String(url).endsWith('/api/products/mine')) return reply([row])
    return reply(row, options.method === 'POST' ? 201 : 200)
  }
  const controller = new AbortController()
  const stored = await createProduct(user.id, productValues, 'draft', controller.signal)
  assert.equal(stored.id, row.id)
  assert.equal(calls.at(-1).url, 'http://127.0.0.1:5000/api/products')
  assert.equal(calls.at(-1).options.method, 'POST')
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), {
    ...productValues,
    listingStatus: 'draft',
  })
  assert.equal(calls.at(-1).options.signal, controller.signal)
  const rows = await getMyProducts(user.id)
  assert.equal(rows.length, 1)
  const savedTable = render(createElement(Table, { listings: rows, onEdit() {}, onClear() {} }))
  assert.match(savedTable, /Stored Tomatoes/)
  assert.ok(!savedTable.includes('Red Tomatoes'))
  accessToken = 'renewed-seller-fixture-token'
  await updateProduct(user.id, row.id, {
    name: 'Updated Tomatoes',
    price: '42.10',
    stock: '3.25',
    status: 'Active',
  })
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), {
    name: 'Updated Tomatoes',
    price: '42.10',
    stock: '3.25',
    listingStatus: 'published',
  })
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer renewed-seller-fixture-token')
  const beforeWrongAccount = calls.filter(call => !call.url.endsWith('/api/auth/me')).length
  await assert.rejects(createProduct('other-user', productValues, 'published'), /log in again/)
  assert.equal(calls.filter(call => !call.url.endsWith('/api/auth/me')).length, beforeWrongAccount)
  for (const status of [400, 401, 409, 503]) {
    globalThis.fetch = async url =>
      String(url).endsWith('/api/auth/me')
        ? reply(user)
        : reply({ message: 'Useful product API error' }, status)
    await assert.rejects(
      createProduct(user.id, productValues, 'published'),
      /Useful product API error/,
    )
    await assert.rejects(getMyProducts(user.id), /Useful product API error/)
  }
  globalThis.fetch = async url => (String(url).endsWith('/api/auth/me') ? reply(user) : reply([]))
  assert.deepEqual(await getMyProducts(user.id), [])
  globalThis.fetch = async url =>
    String(url).endsWith('/api/auth/me')
      ? reply(user)
      : reply([{ ...row, seller_id: 'someone-else' }])
  await assert.rejects(getMyProducts(user.id), /did not belong/)
  globalThis.fetch = async () => {
    throw new Error('Private network information')
  }
  await assert.rejects(getMyProducts(user.id), /Cannot reach/)
  const addSource = await readFile(
    new URL('../src/pages/seller/AddProduct.tsx', import.meta.url),
    'utf8',
  )
  assert.ok(
    addSource.indexOf('await createProduct') < addSource.indexOf("navigate('/seller/products'"),
  )
  const pageSource = await readFile(
    new URL('../src/pages/seller/MyProducts.tsx', import.meta.url),
    'utf8',
  )
  assert.ok(!pageSource.includes('mockSellerListings'))
  assert.match(pageSource, /await updateProduct/)
  assert.match(pageSource, /await getMyProducts/)
  console.log(
    'PASS: mocked real-product POST/GET/PUT requests, decimal strings, no images or seller IDs submitted, account/token checks, API/network errors, empty lists, owned-row projection and saved-list rendering. Navigation wiring checked statically; no hosted products created.',
  )
  console.log(
    'PASS: route/navigation, case/whitespace search, combined filters, reset baseline, empty results, editing validation, decimal stock, status consistency, updated statistics, immutable datasets/units, and page/editor rendering.',
  )
  console.log(
    'Manual browser checks remain: View/Edit and Cancel/Escape interactions, focus, applying edits and live statistics/filter updates, Clear Filters clicks, and responsive appearance.',
  )
} finally {
  globalThis.fetch = originalFetch
  if (originalClient === undefined) delete globalThis.__sellerClientFixture
  else globalThis.__sellerClientFixture = originalClient
  await server.close()
}
