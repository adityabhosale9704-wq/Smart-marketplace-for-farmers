import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { mockSellerListings: listings, mockSellerOrders: orders, deriveSellerStatistics } = await load('data/mockSellerData.ts')
  const { default: Dashboard } = await load('pages/seller/SellerDashboard.tsx')
  const { default: Products } = await load('components/seller/RecentProducts.tsx')
  const { default: Orders } = await load('components/seller/RecentOrders.tsx')
  const { CartContext } = await load('context/cartContextValue.ts')
  const cart = { cartItems: [], totalItemCount: 0, estimatedSubtotal: 0, message: '', storageWarning: false, addItem() {}, removeItem() {}, updateQuantity() {}, clearCart() {} }
  const render = element => renderToStaticMarkup(createElement(CartContext.Provider, { value: cart }, createElement(MemoryRouter, { initialEntries: ['/seller/dashboard'] }, element)))
  assert.deepEqual(deriveSellerStatistics(listings, orders), { totalProducts: 5, activeListings: 3, outOfStockProducts: 1, incomingOrders: 5, demonstrationSalesValue: 1560 })
  assert.deepEqual(deriveSellerStatistics(), { totalProducts: 0, activeListings: 0, outOfStockProducts: 0, incomingOrders: 0, demonstrationSalesValue: 0 })
  assert.equal(deriveSellerStatistics([], orders).incomingOrders, 5)
  assert.equal(new Set(listings.map(listing => listing.id)).size, listings.length)
  for (const order of orders) {
    assert.ok(order.items.every(item => listings.some(listing => listing.id === item.listingId)))
    assert.ok(order.reference.startsWith('SAMPLE-'))
  }
  const html = render(createElement(Routes, null, createElement(Route, { path: '/seller/dashboard', element: createElement(Dashboard) })))
  for (const text of ['Welcome to your seller preview', 'accessible without login', 'Recent Products', 'Recent Orders', 'SAMPLE / DEMONSTRATION', 'Stock overview', 'Low stock', 'Out of stock', 'href="/seller/dashboard"']) assert.ok(html.includes(text), text)
  assert.ok(html.includes(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(1560)))
  assert.equal((html.match(/Example: /g) || []).length, 5)
  assert.ok(render(createElement(Products)).includes('No sample products'))
  assert.ok(render(createElement(Orders)).includes('No sample orders'))
  assert.ok(render(createElement(Orders, { orders: [{ ...orders[0], items: [] }] })).includes('No sample items'))
  const savedListings = listings.splice(0)
  const savedOrders = orders.splice(0)
  try {
    const empty = render(createElement(Dashboard))
    assert.ok(empty.includes('No sample products'))
    assert.ok(empty.includes('No sample orders'))
    assert.ok(empty.includes('No low-stock or zero-stock'))
  } finally { listings.push(...savedListings); orders.push(...savedOrders) }
  for (const page of ['Home', 'Marketplace', 'ProductDetails', 'Cart', 'Checkout', 'Login', 'Register', 'ForgotPassword']) {
    const { default: Page } = await load('pages/' + page + '.tsx')
    assert.ok(render(createElement(Page)).includes('Farm'))
  }
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.ok(app.includes('path="/seller/dashboard"'))
  const navbar = await readFile(new URL('../src/components/Navbar.tsx', import.meta.url), 'utf8')
  assert.ok(navbar.includes("['Sell Products', '/seller/dashboard']"))
  console.log('PASS: dashboard route/rendering, Navbar desktop/mobile destinations, derived stats, sample order references/amounts, low/zero stock, missing references, empty data/components, and existing-page rendering.')
  console.log('Manual visual checks remain: mobile sidebar collapse, navigation clicks, responsive spacing, keyboard use, and overflow.')
} finally { await server.close() }
