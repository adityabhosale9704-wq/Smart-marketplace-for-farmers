import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false } })
const originalFetch = globalThis.fetch
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { validateLogin, validateRegister, validateForgotPassword, focusAuthError } =
    await load('utils/authValidation.ts')
  const { CartContext } = await load('context/cartContextValue.ts')
  const sample = 'a'.repeat(12) + '1'
  const login = { email: 'sample@example.test', password: sample, rememberEmail: false }
  const registration = {
    ...login,
    fullName: 'Sample Farmer',
    mobile: '9876543210',
    confirmPassword: sample,
    termsAcknowledged: true,
  }
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
  for (const email of [
    '',
    'invalid',
    'a@@b.test',
    'a b@c.test',
    'a@b..test',
    'x'.repeat(255) + '@a.test',
  ]) {
    assert.ok(validateLogin({ ...login, email }).email)
    assert.ok(validateForgotPassword({ email }).email)
    assert.ok(validateRegister({ ...registration, email }).email)
  }
  for (const mobile of ['', '1234567890', '+919876543210', '98765'])
    assert.ok(validateRegister({ ...registration, mobile }).mobile)
  for (const fullName of ['', 'A', '1234', '<script>', 'A'.repeat(101)])
    assert.ok(validateRegister({ ...registration, fullName }).fullName)
  let focused = false
  focusAuthError(
    {
      querySelector(selector) {
        assert.equal(selector, '[name="email"]')
        return {
          focus() {
            focused = true
          },
        }
      },
    },
    { email: 'error' },
  )
  assert.equal(focused, true)

  const cart = {
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
  const render = (Component, props = {}) =>
    renderToStaticMarkup(
      createElement(
        CartContext.Provider,
        { value: cart },
        createElement(MemoryRouter, null, createElement(Component, props)),
      ),
    )
  for (const [file, title] of [
    ['Login', 'Welcome back'],
    ['Register', 'Grow with FarmMarket'],
    ['ForgotPassword', 'Forgot your password?'],
  ]) {
    const { default: Page } = await load('pages/' + file + '.tsx')
    const html = render(Page, { session: null, onSessionChange() {}, onSessionClear() {} })
    assert.ok(html.includes(title))
    assert.ok(!html.includes('Authentication is not connected'))
    assert.match(html, /aria-busy="false"/)
    assert.ok(html.includes('<fieldset'))
    assert.match(html, /novalidate/i)
    assert.match(html, /href="\/login"/)
    assert.match(html, /href="\/register"/)
    const source = await readFile(new URL('../src/pages/' + file + '.tsx', import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|fetch\(|console\.|navigate\(/.test(source))
    assert.match(source, /event.preventDefault\(\)/)
    if (file !== 'ForgotPassword') assert.match(html, /type="password"/)
  }
  const { default: PasswordInput } = await load('components/auth/PasswordInput.tsx')
  const passwordHtml = renderToStaticMarkup(
    createElement(PasswordInput, {
      name: 'password',
      label: 'Password',
      value: '',
      onChange() {},
      autoComplete: 'new-password',
      error: 'Sample error',
    }),
  )
  assert.match(passwordHtml, /aria-label="Show password"/)
  assert.match(passwordHtml, /aria-pressed="false"/)
  assert.match(passwordHtml, /type="button"/)
  assert.match(passwordHtml, /aria-invalid="true"/)
  assert.match(passwordHtml, /Sample error/)
  const source = await readFile(
    new URL('../src/components/auth/PasswordInput.tsx', import.meta.url),
    'utf8',
  )
  assert.match(source, /setVisible\(previous => !previous\)/)
  for (const file of ['Home', 'Marketplace', 'ProductDetails', 'Cart', 'Checkout']) {
    const { default: Page } = await load('pages/' + file + '.tsx')
    assert.ok(render(Page).includes('Farm'))
  }
  console.log(
    'PASS: form validation, error focus, auth page rendering, password masking/accessibility, real-auth notices and existing-page rendering.',
  )
  const { registerFarmer, loginFarmer, requestPasswordReset } = await load('services/auth.ts')
  const user = { id: 'verified-farmer', email: 'farmer@example.test' }
  const sessionResponse = {
    message: 'Login successful',
    user,
    accessToken: 'opaque-test-access-token',
    refreshToken: 'unused-test-refresh-token',
    expiresIn: 3600,
  }
  const accepted =
    'Registration request received. If email confirmation is required, check your email. You are not signed in.'
  const calls = []
  const reply = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    if (String(url).endsWith('/api/auth/register')) return reply({ message: accepted })
    if (String(url).endsWith('/api/auth/login')) return reply(sessionResponse)
    if (String(url).endsWith('/api/auth/me')) return reply(user)
    throw new Error('Unexpected API request')
  }
  const controller = new AbortController()
  assert.equal(await registerFarmer(registration, controller.signal), accepted)
  assert.equal(calls[0].url, 'http://127.0.0.1:5000/api/auth/register')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    fullName: registration.fullName,
    email: registration.email,
    password: registration.password,
  })
  assert.equal(calls[0].options.signal, controller.signal)
  const verified = await loginFarmer(login, controller.signal)
  assert.deepEqual(verified, { user, accessToken: sessionResponse.accessToken })
  assert.deepEqual(Object.keys(verified).sort(), ['accessToken', 'user'])
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    email: login.email,
    password: login.password,
  })
  assert.equal(calls[1].options.method, 'POST')
  assert.equal(calls[2].options.method, 'GET')
  assert.equal(calls[2].url, 'http://127.0.0.1:5000/api/auth/me')
  assert.equal(calls[2].options.headers.Authorization, 'Bearer ' + sessionResponse.accessToken)
  assert.ok(calls.every(call => call.options.cache === 'no-store'))
  assert.ok(calls.every(call => !('credentials' in call.options)))

  const recoveryMessage =
    'If an account exists for this email, a password reset email will be sent.'
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'http://127.0.0.1:5000/api/auth/forgot-password')
    assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), { email: login.email })
    assert.equal(options.headers.Authorization, undefined)
    assert.equal(options.signal, controller.signal)
    return reply({ message: recoveryMessage })
  }
  assert.equal(
    await requestPasswordReset({ email: login.email }, controller.signal),
    recoveryMessage,
  )

  for (const status of [400, 401, 429, 503]) {
    globalThis.fetch = async () => reply({ message: 'Safe backend error' }, status)
    await assert.rejects(registerFarmer(registration), /Safe backend error/)
    await assert.rejects(loginFarmer(login), /Safe backend error/)
    await assert.rejects(requestPasswordReset({ email: login.email }), /Safe backend error/)
  }
  globalThis.fetch = async () => {
    throw new Error('Internal network details')
  }
  await assert.rejects(registerFarmer(registration), /Cannot reach the authentication server/)
  await assert.rejects(loginFarmer(login), /Cannot reach the authentication server/)
  await assert.rejects(
    requestPasswordReset({ email: login.email }),
    /Cannot reach the authentication server/,
  )
  globalThis.fetch = async () => new Response('not JSON')
  await assert.rejects(registerFarmer(registration), /unreadable response/)
  globalThis.fetch = async () => reply({})
  await assert.rejects(registerFarmer(registration), /registration response was incomplete/)
  await assert.rejects(loginFarmer(login), /login response was incomplete/)
  await assert.rejects(
    requestPasswordReset({ email: login.email }),
    /recovery response was incomplete/,
  )
  for (const identity of [{ ...user, id: 'different-user' }, {}, null]) {
    globalThis.fetch = async url =>
      reply(String(url).endsWith('/login') ? sessionResponse : identity)
    await assert.rejects(loginFarmer(login), /identity could not be verified/)
  }
  globalThis.fetch = async url =>
    String(url).endsWith('/login')
      ? reply(sessionResponse)
      : reply({ message: 'Invalid or expired access token' }, 401)
  await assert.rejects(loginFarmer(login), /Invalid or expired access token/)

  let finishLogin, finishVerification
  let settled = false
  let requestCount = 0
  globalThis.fetch = () => {
    requestCount++
    return new Promise(resolve => {
      if (requestCount === 1) finishLogin = resolve
      else finishVerification = resolve
    })
  }
  const pendingLogin = loginFarmer(login).then(value => {
    settled = true
    return value
  })
  assert.equal(requestCount, 1)
  assert.equal(settled, false)
  finishLogin(reply(sessionResponse))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(requestCount, 2)
  assert.equal(settled, false)
  finishVerification(reply(user))
  assert.deepEqual(await pendingLogin, { user, accessToken: sessionResponse.accessToken })

  const { default: Login } = await load('pages/Login.tsx')
  const loggedIn = render(Login, { session: verified, onSessionChange() {} })
  assert.match(loggedIn, /Signed in as/)
  assert.match(loggedIn, /farmer@example.test/)
  assert.ok(!loggedIn.includes(sessionResponse.accessToken))
  const { AuthContext } = await load('context/authContextValue.ts')
  const { default: Navbar } = await load('components/Navbar.tsx')
  let temporarySession = verified
  const auth = {
    session: temporarySession,
    clearSession() {
      temporarySession = null
    },
  }
  const navigation = () =>
    render(() => createElement(AuthContext.Provider, { value: auth }, createElement(Navbar)))
  assert.match(navigation(), />Logout</)
  assert.ok(!navigation().includes('href="/login"'))
  auth.clearSession()
  auth.session = temporarySession
  assert.equal(temporarySession, null)
  assert.match(navigation(), /href="\/login"/)
  assert.match(navigation(), /href="\/register"/)
  assert.ok(!navigation().includes('>Logout<'))
  const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(appSource, /clearSession: \(\) => setSession\(null\)/)
  const navbarSource = await readFile(
    new URL('../src/components/Navbar.tsx', import.meta.url),
    'utf8',
  )
  assert.match(navbarSource, /auth\?\.clearSession\(\)/)
  assert.match(navbarSource, /navigate\('\/login', \{ replace: true \}\)/)
  for (const file of ['pages/Login.tsx', 'pages/Register.tsx', 'services/auth.ts', 'App.tsx']) {
    const content = await readFile(new URL('../src/' + file, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|console\./.test(content), file)
  }
  for (const file of ['Login', 'Register', 'ForgotPassword']) {
    const content = await readFile(
      new URL('../src/pages/' + file + '.tsx', import.meta.url),
      'utf8',
    )
    assert.match(content, /disabled=\{loading\}/)
    assert.match(content, /role="alert"/)
    assert.match(content, /pending\.current\?\.abort\(\)/)
    if (file !== 'ForgotPassword') assert.match(content, /password: ''/)
  }
  console.log(
    'PASS: mocked recovery payload, generic response, network/rate-limit errors, recovery form safeguards and navigation rendered with/without a session. Logout click/state wiring checked statically; browser interaction remains manual.',
  )
  console.log(
    'PASS: mocked registration/login payloads, backend errors, network/invalid responses, Bearer identity verification, verification failure/pending states, token projection and authenticated markup.',
  )
  console.log(
    'Manual browser checks remain: actual submit/loading/error interactions, disabled controls, focus, route changes during requests, refresh clearing the session and responsive appearance. Live Supabase was not contacted.',
  )
} finally {
  globalThis.fetch = originalFetch
  await server.close()
}
