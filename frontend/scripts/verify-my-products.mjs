import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { mockSellerListings } = await load('data/mockSellerData.ts')
  const { mockProducts } = await load('data/mockProducts.ts')
  const { sellerProductStatus, sellerListingCounts, filterSellerProducts, sellerEditValues, validateSellerEdit, applySellerEdit } = await load('utils/sellerProductUtils.ts')
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
  assert.equal(filterSellerProducts(listings, { ...empty, search: '  RED   TOMATOES  ' })[0].id, 'demo-farm-tomatoes')
  assert.equal(filterSellerProducts(listings, { ...empty, category: 'vegetables', status: 'Active' }).length, 2)
  assert.equal(filterSellerProducts(listings, { ...empty, status: 'Draft' }).length, 1)
  assert.equal(filterSellerProducts(listings, { ...empty, status: 'Out of Stock' })[0].name, 'Golden Wheat')
  assert.equal(filterSellerProducts(listings, { ...empty, category: 'fruits' }).length, 0)
  assert.deepEqual(sellerListingCounts(listings), { total: 5, active: 3, draft: 1, outOfStock: 1 })
  assert.deepEqual(sellerListingCounts([]), { total: 0, active: 0, draft: 0, outOfStock: 0 })
  const values = sellerEditValues(listings[0])
  assert.deepEqual(validateSellerEdit(values), {})
  for (const price of ['', '-1', '0', 'NaN', 'Infinity', '1000001', '1e8', '1.111']) assert.ok(validateSellerEdit({ ...values, price }).price)
  for (const stock of ['', '-1', 'NaN', 'Infinity', '1000001', '1.111']) assert.ok(validateSellerEdit({ ...values, stock }).stock)
  assert.ok(validateSellerEdit({ ...values, name: ' ' }).name)
  assert.ok(validateSellerEdit({ ...values, name: 'x'.repeat(101) }).name)
  assert.ok(validateSellerEdit({ ...values, status: 'unknown' }).status)
  assert.ok(validateSellerEdit({ ...values, stock: '0', status: 'Active' }).status)
  assert.ok(validateSellerEdit({ ...values, stock: '2', status: 'Out of Stock' }).status)
  assert.deepEqual(validateSellerEdit({ ...values, stock: '0', status: 'Draft' }), {})
  const edited = applySellerEdit(listings[0], { name: '  New   Tomatoes ', price: '42.50', stock: '0', status: 'Out of Stock' })
  assert.equal(edited.name, 'New Tomatoes')
  assert.equal(edited.price, 42.5)
  assert.equal(edited.unit, listings[0].unit)
  assert.equal(edited.id, listings[0].id)
  assert.equal(edited.category, listings[0].category)
  assert.equal(sellerProductStatus(edited), 'Out of Stock')
  const updated = listings.map(item => item.id === edited.id ? edited : item)
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

  const context = { cartItems: [], totalItemCount: 0, estimatedSubtotal: 0, message: '', storageWarning: false, addItem() {}, removeItem() {}, updateQuantity() {}, clearCart() {} }
  const render = element => renderToStaticMarkup(createElement(CartContext.Provider, { value: context }, createElement(MemoryRouter, { initialEntries: ['/seller/products'] }, element)))
  const html = render(createElement(Page))
  for (const text of ['My Products', 'href="/seller/products"', 'href="/seller/add-product"', 'View / Edit', 'Changes exist only here', 'Clear Filters']) assert.ok(html.includes(text), text)
  assert.ok(render(createElement(Table, { listings: [], onEdit() {}, onClear() {} })).includes('No demonstration products found'))
  assert.ok(render(createElement(Editor, { listing: edited, onApply() {}, onCancel() {} })).includes('Apply Demo Changes'))
  assert.ok(render(createElement(Filters, { filters: empty, onChange() {}, onClear() {} })).includes('Clear Filters'))
  for (const path of ['pages/seller/MyProducts.tsx', 'components/seller/EditProductPanel.tsx']) {
    const source = await readFile(new URL('../src/' + path, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|fetch\(|console\./.test(source))
  }
  assert.ok((await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')).includes('path="/seller/products"'))
  console.log('PASS: route/navigation, case/whitespace search, combined filters, reset baseline, empty results, editing validation, decimal stock, status consistency, updated statistics, immutable datasets/units, and page/editor rendering.')
  console.log('Manual browser checks remain: View/Edit and Cancel/Escape interactions, focus, applying edits and live statistics/filter updates, Clear Filters clicks, and responsive appearance.')
} finally { await server.close() }

