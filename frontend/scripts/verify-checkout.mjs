import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

const server = await createServer({ server: { middlewareMode: true } })
const originalWindow = globalThis.window
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { validateDeliveryDetails, fieldLimits } = await load('utils/checkoutValidation.ts')
  const { emptyDeliveryDetails } = await load('types/checkout.ts')
  const { default: DeliveryForm } = await load('components/checkout/DeliveryForm.tsx')
  const { default: Checkout } = await load('pages/Checkout.tsx')
  const { default: Summary } = await load('components/checkout/OrderSummary.tsx')
  const { default: Cart } = await load('pages/Cart.tsx')
  const { CartContext } = await load('context/cartContextValue.ts')
  const { mockProducts } = await load('data/mockProducts.ts')
  const valid = {
    ...emptyDeliveryDetails, fullName: 'Sample Buyer', mobile: '9876543210',
    addressLine1: '12 Sample Road', city: 'Pune', district: 'Pune',
    state: 'Maharashtra', pinCode: '411001',
  }
  assert.deepEqual(validateDeliveryDetails(valid).errors, {})
  assert.deepEqual(validateDeliveryDetails({ ...valid, email: 'sample@example.test' }).errors, {})
  const trimmed = validateDeliveryDetails({ ...valid, fullName: '  Sample   Buyer  ', mobile: ' 9876543210 ', notes: '  Sample note  ' })
  assert.deepEqual(trimmed.errors, {})
  assert.equal(trimmed.details.fullName, 'Sample Buyer')
  assert.equal(trimmed.details.notes, 'Sample note')
  assert.ok(validateDeliveryDetails({ ...valid, addressLine1: '!!!!!' }).errors.addressLine1)
  const required = ['fullName', 'mobile', 'addressLine1', 'city', 'district', 'state', 'pinCode']
  for (const field of required) assert.ok(validateDeliveryDetails({ ...valid, [field]: '   ' }).errors[field])
  for (const mobile of ['1234567890', '98765', '+919876543210', '98765 43210', 'abcdefghij']) {
    assert.ok(validateDeliveryDetails({ ...valid, mobile }).errors.mobile)
  }
  for (const pinCode of ['012345', '12345', '1234567', 'abcdef']) {
    assert.ok(validateDeliveryDetails({ ...valid, pinCode }).errors.pinCode)
  }
  for (const email of ['wrong', 'a@@b.test', 'a@b', 'a b@example.test']) {
    assert.ok(validateDeliveryDetails({ ...valid, email }).errors.email)
  }
  for (const fullName of ['A', '123', 'AB<script>', '---']) {
    assert.ok(validateDeliveryDetails({ ...valid, fullName }).errors.fullName)
  }
  for (const [field, limit] of Object.entries(fieldLimits)) {
    assert.ok(validateDeliveryDetails({ ...valid, [field]: 'x'.repeat(limit + 1) }).errors[field])
  }

  const validForm = renderToStaticMarkup(createElement(DeliveryForm, { details: valid, errors: {}, onChange() {}, onReview() {} }))
  assert.equal((validForm.match(/<input /g) || []).length, 9)
  assert.match(validForm, /name="city"/)
  assert.match(validForm, /value="Pune"/)
  assert.match(validForm, /type="submit"/)
  const errors = validateDeliveryDetails(emptyDeliveryDetails).errors
  const invalidForm = renderToStaticMarkup(createElement(DeliveryForm, { details: emptyDeliveryDetails, errors, onChange() {}, onReview() {} }))
  assert.match(invalidForm, /role="alert"/)
  assert.match(invalidForm, /aria-invalid="true"/)
  assert.match(invalidForm, /This field is required/)

  const lines = [
    { productId: 'tomatoes', quantity: 3, product: mockProducts.find(product => product.id === 'tomatoes') },
    { productId: 'rice', quantity: 2, product: mockProducts.find(product => product.id === 'rice') },
  ]
  const context = items => ({
    cartItems: items, totalItemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    estimatedSubtotal: items.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    message: '', storageWarning: false, addItem() {}, removeItem() {}, updateQuantity() {}, clearCart() {},
  })
  const render = (component, items) => renderToStaticMarkup(createElement(CartContext.Provider, { value: context(items) },
    createElement(MemoryRouter, { initialEntries: ['/checkout'] }, createElement(component))))
  const empty = render(Checkout, [])
  assert.match(empty, /Your cart is empty/)
  assert.ok(!empty.includes('<form'))
  const checkout = render(Checkout, lines)
  assert.match(checkout, /Review Details/)
  assert.match(checkout, /name="fullName"/)
  assert.match(render(Cart, lines), /href="\/checkout"/)
  const summary = render(Summary, lines)
  assert.match(summary, /Ramesh Patil/)
  assert.match(summary, /Harpreet Kaur/)
  assert.match(summary, /3 kg/)
  assert.match(summary, /2 quintal/)
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
  assert.ok(summary.includes(formatter.format(13696)))
  assert.ok(render(Summary, [{ ...lines[0], quantity: 1 }]).includes(formatter.format(32)))
  assert.match(summary, /not a final payable amount/)
  assert.match(summary, /no shared shipment is assumed/)

  for (const file of ['pages/Checkout.tsx', 'components/checkout/DeliveryForm.tsx', 'components/checkout/OrderSummary.tsx', 'utils/checkoutValidation.ts']) {
    const source = await readFile(new URL('../src/' + file, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|fetch\(|axios|console\./.test(source), 'Unexpected persistence/network/logging in ' + file)
  }
  assert.match(await readFile(new URL('../src/pages/Checkout.tsx', import.meta.url), 'utf8'), /Order Placement Coming Soon/)
  console.log('PASS: valid/invalid details, required fields, whitespace, lengths, phone/email/PIN, controlled form rendering, inline errors, checkout navigation, empty protection, multi-seller/mixed-unit/current-cart summary, totals, and no checkout storage/network/logging calls.')
  console.log('Manual browser checks remain: Review/Edit interaction and focus, actual reload clearing form values, live cart updates during review, responsive layout, and autofill behavior.')
} finally {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
  await server.close()
}
