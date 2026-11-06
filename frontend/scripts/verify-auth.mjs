import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { validateLogin, validateRegister, validateForgotPassword, focusAuthError } = await load('utils/authValidation.ts')
  const { CartContext } = await load('context/cartContextValue.ts')
  const sample = 'a'.repeat(12) + '1'
  const login = { email: 'sample@example.test', password: sample, rememberEmail: false }
  const registration = { ...login, fullName: 'Sample Farmer', mobile: '9876543210', confirmPassword: sample, termsAcknowledged: true }
  assert.deepEqual(validateLogin(login), {})
  assert.deepEqual(validateLogin({ ...login, email: '  sample@example.test  ' }), {})
  assert.deepEqual(validateRegister(registration), {})
  assert.deepEqual(validateForgotPassword({ email: login.email }), {})
  assert.ok(validateLogin({ ...login, password: '' }).password)
  assert.ok(validateLogin({ ...login, password: 'x'.repeat(11) }).password)
  assert.ok(validateLogin({ ...login, password: 'x'.repeat(129) }).password)
  assert.ok(validateRegister({ ...registration, password: 'x'.repeat(12) }).password)
  assert.ok(validateRegister({ ...registration, confirmPassword: sample + ' ' }).confirmPassword)
  assert.ok(validateRegister({ ...registration, termsAcknowledged: false }).termsAcknowledged)
  for (const email of ['', 'invalid', 'a@@b.test', 'a b@c.test', 'a@b..test', 'x'.repeat(255) + '@a.test']) {
    assert.ok(validateLogin({ ...login, email }).email)
    assert.ok(validateForgotPassword({ email }).email)
    assert.ok(validateRegister({ ...registration, email }).email)
  }
  for (const mobile of ['', '1234567890', '+919876543210', '98765']) assert.ok(validateRegister({ ...registration, mobile }).mobile)
  for (const fullName of ['', 'A', '1234', '<script>', 'A'.repeat(101)]) assert.ok(validateRegister({ ...registration, fullName }).fullName)
  let focused = false
  focusAuthError({ querySelector(selector) { assert.equal(selector, '[name="email"]'); return { focus() { focused = true } } } }, { email: 'error' })
  assert.equal(focused, true)

  const cart = { cartItems: [], totalItemCount: 0, estimatedSubtotal: 0, message: '', storageWarning: false, addItem() {}, removeItem() {}, updateQuantity() {}, clearCart() {} }
  const render = Component => renderToStaticMarkup(createElement(CartContext.Provider, { value: cart }, createElement(MemoryRouter, null, createElement(Component))))
  for (const [file, title] of [['Login', 'Welcome back'], ['Register', 'Grow with FarmMarket'], ['ForgotPassword', 'Forgot your password?']]) {
    const { default: Page } = await load('pages/' + file + '.tsx')
    const html = render(Page)
    assert.ok(html.includes(title))
    assert.match(html, /Demonstration UI only/)
    assert.match(html, /novalidate/i)
    assert.match(html, /href="\/login"/)
    assert.match(html, /href="\/register"/)
    const source = await readFile(new URL('../src/pages/' + file + '.tsx', import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|fetch\(|console\.|navigate\(/.test(source))
    assert.match(source, /event.preventDefault\(\)/)
    if (file !== 'ForgotPassword') assert.match(html, /type="password"/)
  }
  const { default: PasswordInput } = await load('components/auth/PasswordInput.tsx')
  const passwordHtml = renderToStaticMarkup(createElement(PasswordInput, { name: 'password', label: 'Password', value: '', onChange() {}, autoComplete: 'new-password', error: 'Sample error' }))
  assert.match(passwordHtml, /aria-label="Show password"/)
  assert.match(passwordHtml, /aria-pressed="false"/)
  assert.match(passwordHtml, /type="button"/)
  assert.match(passwordHtml, /aria-invalid="true"/)
  assert.match(passwordHtml, /Sample error/)
  const source = await readFile(new URL('../src/components/auth/PasswordInput.tsx', import.meta.url), 'utf8')
  assert.match(source, /setVisible\(previous => !previous\)/)
  for (const file of ['Home', 'Marketplace', 'ProductDetails', 'Cart', 'Checkout']) {
    const { default: Page } = await load('pages/' + file + '.tsx')
    assert.ok(render(Page).includes('Farm'))
  }
  console.log('PASS: required/length/email/name/mobile/password/confirmation/acknowledgement validation, error focus helper, all auth page rendering, masked password/accessibility defaults, demo notices, no page storage/network/logging/redirect calls, and existing-page rendering.')
  console.log('Manual browser checks remain: submit/error/neutral-message interactions, show/hide clicks, keyboard focus, mobile navigation/layout, and page-leave/reset behavior.')
} finally { await server.close() }
