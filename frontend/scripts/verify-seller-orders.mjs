import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { mockSellerOrders: orders, mockSellerListings: listings } = await load('data/mockSellerData.ts')
  const { mockProducts } = await load('data/mockProducts.ts')
  const { lineSubtotal, sellerOrderSubtotal, countSellerOrders, filterSellerOrders, orderStatuses, canChangeOrderStatus, updateDemoOrderStatus } = await load('utils/sellerOrderUtils.ts')
  const { default: Page } = await load('pages/seller/SellerOrders.tsx')
  const { default: Table } = await load('components/seller/OrderTable.tsx')
  const { default: Details } = await load('components/seller/OrderDetails.tsx')
  const { default: Filters } = await load('components/seller/OrderFilters.tsx')
  const { default: Badge } = await load('components/seller/OrderStatusBadge.tsx')
  const { CartContext } = await load('context/cartContextValue.ts')
  const original = JSON.stringify({ orders, listings, mockProducts })
  const empty = { search: '', status: '' }
  assert.equal(orders.length, 8)
  assert.equal(new Set(orders.map(order => order.reference)).size, orders.length)
  for (const order of orders) {
    assert.match(order.reference, /^SAMPLE-/)
    assert.match(order.buyerName, /^Sample Buyer [A-H]$/)
    assert.ok(!/@|\d{10}/.test(order.buyerName + order.deliveryCity + order.deliveryState))
    assert.ok(order.items.length > 0)
    for (const item of order.items) {
      const listing = listings.find(candidate => candidate.id === item.listingId)
      assert.ok(listing)
      assert.equal(item.productName, listing.name)
      assert.equal(item.unit, listing.unit)
      assert.equal(item.unitPrice, listing.price)
      assert.ok(item.quantity > 0)
      assert.equal(lineSubtotal(item), item.quantity * item.unitPrice)
    }
  }
  assert.equal(lineSubtotal({ quantity: 0.1, unitPrice: 0.2 }), 0.02)
  assert.equal(sellerOrderSubtotal(orders[4]), 2 * 32 + 3 * 28)
  assert.equal(sellerOrderSubtotal(orders[6]), 2600 + 2 * 32)
  assert.equal(sellerOrderSubtotal({ items: [] }), 0)
  assert.deepEqual(countSellerOrders(orders), { total: 8, Pending: 3, Confirmed: 2, Completed: 2, Cancelled: 1 })
  assert.equal(countSellerOrders([]).total, 0)
  assert.equal(filterSellerOrders(orders, { ...empty, search: '  sample-005  ' })[0].reference, 'SAMPLE-005')
  assert.equal(filterSellerOrders(orders, { ...empty, search: '  SAMPLE   BUYER B ' })[0].reference, 'SAMPLE-002')
  assert.ok(filterSellerOrders(orders, { ...empty, search: 'tur dal' }).every(order => order.items.some(item => item.productName === 'Tur Dal')))
  assert.equal(filterSellerOrders(orders, { search: 'tomatoes', status: 'Pending' }).length, 2)
  assert.equal(filterSellerOrders(orders, { ...empty, search: 'nothing-matches' }).length, 0)
  assert.equal(filterSellerOrders(orders, empty).length, 8)
  const expected = new Set(['Pending:Confirmed', 'Pending:Cancelled', 'Confirmed:Completed', 'Confirmed:Cancelled'])
  for (const from of orderStatuses) for (const to of orderStatuses) assert.equal(canChangeOrderStatus(from, to), expected.has(from + ':' + to))
  let changed = updateDemoOrderStatus(orders, 'SAMPLE-001', 'Confirmed')
  assert.equal(countSellerOrders(changed).Pending, 2)
  assert.equal(countSellerOrders(changed).Confirmed, 3)
  changed = updateDemoOrderStatus(changed, 'SAMPLE-001', 'Completed')
  assert.equal(countSellerOrders(changed).Completed, 3)
  changed = updateDemoOrderStatus(changed, 'SAMPLE-001', 'Pending')
  assert.equal(changed[0].status, 'Completed')
  let cancelled = updateDemoOrderStatus(orders, 'SAMPLE-001', 'Cancelled')
  cancelled = updateDemoOrderStatus(cancelled, 'SAMPLE-001', 'Confirmed')
  assert.equal(cancelled[0].status, 'Cancelled')
  assert.equal(updateDemoOrderStatus(orders, 'missing', 'Confirmed')[0].status, orders[0].status)
  assert.equal(JSON.stringify({ orders, listings, mockProducts }), original)

  const cart = { cartItems: [], totalItemCount: 0, estimatedSubtotal: 0, message: '', storageWarning: false, addItem() {}, removeItem() {}, updateQuantity() {}, clearCart() {} }
  const render = element => renderToStaticMarkup(createElement(CartContext.Provider, { value: cart },
    createElement(MemoryRouter, { initialEntries: ['/seller/orders'] }, element)))
  const page = render(createElement(Routes, null, createElement(Route, { path: '/seller/orders', element: createElement(Page) })))
  for (const text of ['Seller Orders', 'SAMPLE / DEMONSTRATION ONLY', 'href="/seller/orders"', '8 of 8', 'View Details']) assert.ok(page.includes(text), text)
  assert.ok(render(createElement(Table, { orders: [], onView() {}, onClear() {} })).includes('No demonstration orders found'))
  assert.ok(render(createElement(Filters, { filters: empty, onChange() {}, onClear() {} })).includes('Clear Filters'))
  const details = render(createElement(Details, { order: orders[6], onClose() {}, onStatusChange() {} }))
  for (const text of ['Golden Wheat', '1 quintal', '2 kg', 'Fictional buyer', 'final state', 'Close Details', 'Bhopal']) assert.ok(details.includes(text), text)
  const pending = render(createElement(Details, { order: orders[0], onClose() {}, onStatusChange() {} }))
  assert.ok(pending.includes('Demo: mark Confirmed'))
  assert.ok(pending.includes('Demo: mark Cancelled'))
  assert.ok(!pending.includes('Demo: mark Completed'))
  for (const status of orderStatuses) assert.ok(render(createElement(Badge, { status })).includes(status))
  for (const path of ['pages/seller/SellerOrders.tsx', 'components/seller/OrderDetails.tsx', 'utils/sellerOrderUtils.ts']) {
    const source = await readFile(new URL('../src/' + path, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|fetch\(|console\./.test(source))
  }
  console.log('PASS: seller-only fictional fixtures, order route/navigation, reference/buyer/product search, combined status filters, reset baseline, empty results, details/units, line/order totals, all permitted/forbidden transitions, updated counts, terminal states, and unchanged stock/Marketplace/seed data.')
  console.log('Manual browser checks remain: filter/reset clicks, details open/close/Escape and focus, live status updates/statistics, responsive layout, and refresh restoring seeds.')
} finally { await server.close() }
