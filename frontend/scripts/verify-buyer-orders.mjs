import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { mockBuyerOrders: orders } = await load('data/mockBuyerOrders.ts')
  const { mockSellerOrders, mockSellerListings } = await load('data/mockSellerData.ts')
  const { mockProducts } = await load('data/mockProducts.ts')
  const { buyerLineSubtotal, buyerOrderSubtotal, buyerOrderStatus, buyerOrderCounts, filterBuyerOrders } = await load('utils/buyerOrderUtils.ts')
  const { default: Page } = await load('pages/MyOrders.tsx')
  const { default: Card } = await load('components/orders/BuyerOrderCard.tsx')
  const { default: Details } = await load('components/orders/BuyerOrderDetails.tsx')
  const { default: Progress } = await load('components/orders/OrderProgress.tsx')
  const { default: Filters } = await load('components/orders/BuyerOrderFilters.tsx')
  const { CartContext } = await load('context/cartContextValue.ts')
  const original = JSON.stringify({ orders, mockSellerOrders, mockSellerListings, mockProducts })
  const empty = { search: '', status: '' }
  assert.equal(orders.length, 7)
  assert.equal(new Set(orders.map(order => order.reference)).size, 7)
  assert.deepEqual(buyerOrderCounts(orders), { total: 7, inProgress: 3, completed: 2 })
  assert.deepEqual(buyerOrderCounts([]), { total: 0, inProgress: 0, completed: 0 })
  for (const order of orders) {
    assert.match(order.reference, /^SAMPLE-BUY-/)
    assert.ok(order.fulfillments.length > 0)
    for (const fulfillment of order.fulfillments) {
      assert.match(fulfillment.sellerName, /^Sample Grower/)
      assert.ok(!/@|\d{10}/.test(fulfillment.sellerName + order.deliveryCity + order.deliveryState))
      for (const item of fulfillment.items) {
        assert.ok(mockProducts.some(product => product.id === item.productId && product.unit === item.unit))
        assert.equal(buyerLineSubtotal(item), item.quantity * item.unitPrice)
      }
    }
  }
  assert.equal(buyerLineSubtotal({ quantity: 0.1, unitPrice: 0.2 }), 0.02)
  assert.equal(buyerOrderSubtotal(orders[0]), 144)
  assert.equal(buyerOrderSubtotal(orders[3]), 13760)
  assert.equal(buyerOrderStatus(orders[3]), 'Mixed')
  assert.equal(buyerOrderStatus(orders[4]), 'Cancelled')
  assert.equal(buyerOrderStatus(orders[6]), 'Mixed')
  assert.equal(buyerOrderStatus({ fulfillments: [] }), null)
  assert.equal(buyerOrderSubtotal({ fulfillments: [] }), 0)
  assert.equal(filterBuyerOrders(orders, { ...empty, search: '  SAMPLE-buy-004 ' })[0].reference, 'SAMPLE-BUY-004')
  assert.equal(filterBuyerOrders(orders, { ...empty, search: '  sample   grower c ' }).length, 2)
  assert.equal(filterBuyerOrders(orders, { ...empty, search: 'tomatoes' }).length, 2)
  assert.equal(filterBuyerOrders(orders, { search: 'grower b', status: 'Mixed' }).length, 1)
  assert.equal(filterBuyerOrders(orders, { ...empty, status: 'Completed' }).length, 2)
  assert.equal(filterBuyerOrders(orders, { ...empty, status: 'Mixed' }).length, 2)
  assert.equal(filterBuyerOrders(orders, { ...empty, search: 'nonexistent' }).length, 0)
  assert.equal(filterBuyerOrders(orders, empty).length, 7)
  assert.equal(JSON.stringify({ orders, mockSellerOrders, mockSellerListings, mockProducts }), original)

  const context = { cartItems: [], totalItemCount: 0, estimatedSubtotal: 0, message: '', storageWarning: false, addItem() {}, removeItem() {}, updateQuantity() {}, clearCart() {} }
  const render = (element, entry = '/my-orders') => renderToStaticMarkup(createElement(CartContext.Provider, { value: context }, createElement(MemoryRouter, { initialEntries: [entry] }, element)))
  const page = render(createElement(Routes, null, createElement(Route, { path: '/my-orders', element: createElement(Page) })))
  for (const text of ['My Orders', 'Public demonstration preview', '7 of 7', 'href="/my-orders"', 'Clear Filters', 'View Details']) assert.ok(page.includes(text), text)
  const selected = render(createElement(Page), '/my-orders?order=SAMPLE-BUY-004')
  assert.ok(selected.includes('Demonstration details: SAMPLE-BUY-004'))
  assert.ok(selected.includes('Close Details'))
  assert.ok(render(createElement(Page), '/my-orders?order=invalid').includes('Order reference not found'))
  assert.ok(render(createElement(Page), '/my-orders?order=').includes('Order reference not found'))
  const multi = render(createElement(Details, { order: orders[3], onClose() {} }))
  for (const text of ['Sample Grower A', 'Sample Grower C', '5 kg', '2 quintal', 'Example: Pending', 'Example: Completed', 'Line estimate', 'not created by the Checkout']) assert.ok(multi.includes(text), text)
  const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
  assert.ok(multi.includes(money.format(13760)))
  assert.ok(render(createElement(Card, { order: orders[3], onView() {} })).includes('Mixed seller statuses'))
  const cancelled = render(createElement(Progress, { status: 'Cancelled', sellerName: 'Sample Grower B' }))
  assert.ok(cancelled.includes('not successful completion'))
  assert.ok(!cancelled.includes('<ol'))
  const pending = render(createElement(Progress, { status: 'Pending', sellerName: 'Sample Grower A' }))
  assert.equal((pending.match(/aria-current="step"/g) || []).length, 1)
  assert.ok(!pending.includes('Shipped'))
  assert.ok(!pending.includes('Delivered'))
  assert.ok(render(createElement(Filters, { filters: empty, onChange() {}, onClear() {} })).includes('Mixed'))

  const saved = orders.splice(0)
  try {
    assert.ok(render(createElement(Page)).includes('No demonstration orders available'))
    assert.ok(render(createElement(Page), '/my-orders?order=SAMPLE-BUY-001').includes('Order reference not found'))
  } finally { orders.push(...saved) }
  for (const path of ['pages/MyOrders.tsx','components/orders/BuyerOrderDetails.tsx','data/mockBuyerOrders.ts','utils/buyerOrderUtils.ts']) {
    const source = await readFile(new URL('../src/' + path, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|fetch\(|console\./.test(source))
  }
  const navbar = await readFile(new URL('../src/components/Navbar.tsx', import.meta.url), 'utf8')
  assert.ok(navbar.includes("['My Orders (Demo)', '/my-orders']"))
  console.log('PASS: route/navbar, buyer fixture isolation, product/seller/reference search, combined status filters, reset baseline, empty orders, missing/invalid references, card/details rendering, mixed seller statuses, cancelled progress, and line/purchase totals.')
  console.log('Manual browser checks remain: filter/reset controls, details opening/closing/back/Escape and focus, mobile navigation/layout, and reload behavior.')
} finally { await server.close() }
