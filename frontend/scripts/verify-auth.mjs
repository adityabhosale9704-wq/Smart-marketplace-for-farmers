import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

// Replace only the browser SDK boundary; all application auth logic still runs.
let savedSession = null
let restoreError = null
let signOutError = null
let saveError = null
const listeners = new Set()
const savedPairs = []
const signOutScopes = []
const emit = (event, session) => {
  savedSession = session
  for (const callback of listeners) callback(event, session)
}
const originalClientFixture = globalThis.__farmMarketAuthFixture
globalThis.__farmMarketAuthFixture = {
  auth: {
    async setSession(tokens) {
      if (saveError) return { data: { session: null }, error: saveError }
      savedPairs.push(tokens)
      const session = { ...tokens, user: { id: 'verified-farmer', email: 'farmer@example.test' } }
      emit('SIGNED_IN', session)
      return { data: { session }, error: null }
    },
    async getSession() {
      return { data: { session: savedSession }, error: restoreError }
    },
    onAuthStateChange(callback) {
      listeners.add(callback)
      queueMicrotask(() => {
        if (listeners.has(callback)) callback('INITIAL_SESSION', savedSession)
      })
      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(callback)
            },
          },
        },
      }
    },
    async signOut(options) {
      signOutScopes.push(options.scope)
      if (signOutError) return { error: signOutError }
      emit('SIGNED_OUT', null)
      return { error: null }
    },
  },
}
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  plugins: [
    {
      name: 'mock-browser-auth',
      enforce: 'pre',
      load(id) {
        if (id.replaceAll('\\', '/').endsWith('/src/services/supabase.ts'))
          return 'export default globalThis.__farmMarketAuthFixture'
      },
    },
  ],
})
const originalFetch = globalThis.fetch
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { validateLogin, validateRegister, validateForgotPassword, focusAuthError } =
    await load('utils/authValidation.ts')
  const { CartContext } = await load('context/cartContextValue.ts')
  const { validateResetPassword } = await load('utils/authValidation.ts')
  assert.deepEqual(
    validateResetPassword({ password: 'NewPassword123!', confirmPassword: 'NewPassword123!' }),
    {},
  )
  for (const password of ['', '   ', 'short', 'a'.repeat(12), '1'.repeat(12), 'a'.repeat(129)]) {
    assert.ok(validateResetPassword({ password, confirmPassword: password }).password)
  }
  assert.ok(
    validateResetPassword({ password: 'NewPassword123!', confirmPassword: '' }).confirmPassword,
  )
  assert.ok(
    validateResetPassword({ password: 'NewPassword123!', confirmPassword: 'different' })
      .confirmPassword,
  )
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
    assert.ok(!/localStorage|sessionStorage|fetch\(|console\./.test(source))
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
  const { verifyRecoveryLink, resetPassword } = await load('services/auth.ts')
  const { default: ResetPassword } = await load('pages/ResetPassword.tsx')
  const resetHtml = render(ResetPassword)
  assert.match(resetHtml, /Reset your password/)
  assert.match(resetHtml, /Checking recovery link/)
  assert.match(resetHtml, /<fieldset disabled/)
  assert.match(resetHtml, /href="\/login"/)
  for (const url of [
    'http://127.0.0.1:5173/reset-password',
    'http://127.0.0.1:5173/reset-password#error=expired',
    'http://127.0.0.1:5173/reset-password#type=recovery&access_token=only-one-token',
    'http://127.0.0.1:5173/reset-password?code=unsupported',
  ]) {
    await assert.rejects(verifyRecoveryLink(url), /recovery|link/i)
  }
  const recoveryLink =
    'http://127.0.0.1:5173/reset-password#type=recovery&access_token=fixture-access&refresh_token=fixture-refresh'
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'http://127.0.0.1:5000/api/auth/me')
    assert.equal(options.headers.Authorization, 'Bearer fixture-access')
    return new Response(JSON.stringify({ id: 'verified-farmer', email: 'farmer@example.test' }))
  }
  const recovery = await verifyRecoveryLink(recoveryLink)
  assert.equal(savedPairs.length, 0, 'Recovery credentials must not establish a persistent session')
  assert.deepEqual(recovery, { accessToken: 'fixture-access', refreshToken: 'fixture-refresh' })
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'http://127.0.0.1:5000/api/auth/reset-password')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, 'Bearer fixture-access')
    assert.deepEqual(JSON.parse(options.body), {
      password: 'NewPassword123!',
      refreshToken: 'fixture-refresh',
    })
    return new Response(JSON.stringify({ message: 'Password updated' }))
  }
  await resetPassword(recovery, 'NewPassword123!')
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: 'Invalid or expired access token' }), { status: 401 })
  await assert.rejects(verifyRecoveryLink(recoveryLink), /expired/)
  await assert.rejects(resetPassword(recovery, 'NewPassword123!'), /expired/)
  const resetSource = await readFile(
    new URL('../src/pages/ResetPassword.tsx', import.meta.url),
    'utf8',
  )
  assert.match(resetSource, /history.replaceState/)
  assert.match(resetSource, /setSession\(null\)/)
  assert.ok(!/localStorage|sessionStorage|console\./.test(resetSource))
  console.log(
    'PASS: reset password validation, disabled initial form, missing/unsupported/expired recovery links, mocked verified session and update payload/success/failure. URL cleanup and state clearing checked statically.',
  )
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
  assert.deepEqual(savedPairs.at(-1), {
    access_token: sessionResponse.accessToken,
    refresh_token: sessionResponse.refreshToken,
  })
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
  const adminLogin = render(Login, { session: null, admin: true })
  assert.match(adminLogin, /Administrator Login/)
  assert.match(adminLogin, /assigned by a trusted database operator/)
  assert.match(adminLogin, /type="password"/)
  assert.ok(!adminLogin.includes('Create Account'))
  const { default: AdminDashboard } = await load('pages/admin/AdminDashboard.tsx')
  assert.match(render(AdminDashboard), /log in as an administrator/)
  const { AuthContext: AdminContext } = await load('context/authContextValue.ts')
  const adminLoading = render(() =>
    createElement(
      AdminContext.Provider,
      { value: { session: verified, checking: false, async signOut() {} } },
      createElement(AdminDashboard),
    ),
  )
  assert.match(adminLoading, /Checking administrator access and loading counts/)
  assert.ok(!adminLoading.includes('Registered Accounts'))
  const { checkAdminAccess, getAdminDashboard } = await load('services/admin.ts')
  let lastAdminHeaders
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/api/auth/me')) return reply(user)
    lastAdminHeaders = options.headers
    assert.equal(options.method, 'GET')
    if (String(url).endsWith('/api/admin/me')) return reply({ ...user, role: 'admin' })
    assert.ok(String(url).endsWith('/api/admin/dashboard'))
    return reply({ users: 7, products: 3, orders: 0 })
  }
  await checkAdminAccess(user.id)
  assert.equal(lastAdminHeaders.Authorization, 'Bearer ' + savedSession.access_token)
  assert.deepEqual(await getAdminDashboard(user.id), { users: 7, products: 3, orders: 0 })
  savedSession = { ...savedSession, access_token: 'renewed-admin-fixture-token' }
  await getAdminDashboard(user.id)
  assert.equal(lastAdminHeaders.Authorization, 'Bearer renewed-admin-fixture-token')
  for (const status of [401, 403, 503]) {
    globalThis.fetch = async url =>
      String(url).endsWith('/api/auth/me')
        ? reply(user)
        : reply({ message: 'Safe administrator error' }, status)
    await assert.rejects(
      checkAdminAccess(user.id),
      error => error.status === status && error.message === 'Safe administrator error',
    )
    await assert.rejects(getAdminDashboard(user.id), /Safe administrator error/)
  }
  globalThis.fetch = async url =>
    reply(String(url).endsWith('/api/auth/me') ? user : { ...user, role: 'farmer' })
  await assert.rejects(checkAdminAccess(user.id), /access could not be verified/)
  globalThis.fetch = async url =>
    reply(String(url).endsWith('/api/auth/me') ? user : { users: -1, products: 2, orders: 0 })
  await assert.rejects(getAdminDashboard(user.id), /response was incomplete/)
  await assert.rejects(getAdminDashboard('different-user'), /log in again/)
  globalThis.fetch = async () => {
    throw new Error('Private admin transport information')
  }
  await assert.rejects(getAdminDashboard(user.id), /Cannot reach/)
  savedSession = {
    user,
    access_token: sessionResponse.accessToken,
    refresh_token: sessionResponse.refreshToken,
  }
  const adminPageSource = await readFile(
    new URL('../src/pages/admin/AdminDashboard.tsx', import.meta.url),
    'utf8',
  )
  assert.match(adminPageSource, /disabled/)
  assert.match(adminPageSource, /Coming Soon/)
  assert.match(adminPageSource, /role="alert"/)
  assert.match(adminPageSource, /controller.abort\(\)/)
  assert.ok(!/localStorage|sessionStorage|console\./.test(adminPageSource))
  const loginSource = await readFile(new URL('../src/pages/Login.tsx', import.meta.url), 'utf8')
  assert.ok(
    loginSource.indexOf('await checkAdminAccess') <
      loginSource.indexOf("navigate('/admin/dashboard'"),
  )
  const routesSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(routesSource, /path="\/admin\/login"/)
  assert.match(routesSource, /path="\/admin\/dashboard"/)
  console.log(
    'PASS: mocked admin identity/count requests, latest-token and account checks, 401/403/503 handling, invalid responses, login/dashboard loading markup and disabled management placeholders. Live admin setup is not verified.',
  )
  const { AuthContext } = await load('context/authContextValue.ts')
  const { default: Navbar } = await load('components/Navbar.tsx')
  let temporarySession = verified
  const auth = {
    session: temporarySession,
    checking: false,
    async signOut() {
      temporarySession = null
    },
  }
  const navigation = () =>
    render(() => createElement(AuthContext.Provider, { value: auth }, createElement(Navbar)))
  assert.match(navigation(), />Logout</)
  assert.ok(!navigation().includes('href="/login"'))
  await auth.signOut()
  auth.session = temporarySession
  assert.equal(temporarySession, null)
  assert.match(navigation(), /href="\/login"/)
  assert.match(navigation(), /href="\/register"/)
  assert.ok(!navigation().includes('>Logout<'))
  auth.checking = true
  assert.match(navigation(), /Checking session/)
  assert.ok(!navigation().includes('href="/login"'))
  auth.checking = false

  const { watchAuthSession, getAuthenticatedSession, logoutFarmer } = await load('services/auth.ts')
  const flush = () => new Promise(resolve => setImmediate(resolve))
  const changes = []
  const normalSession = {
    access_token: sessionResponse.accessToken,
    refresh_token: sessionResponse.refreshToken,
    user,
  }
  savedSession = normalSession
  const identityRequests = []
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/api/auth/me'))
    identityRequests.push(options.headers.Authorization)
    return reply(user)
  }
  let stopWatching = watchAuthSession((session, error, checking) =>
    changes.push({ session, error, checking }),
  )
  await flush()
  assert.deepEqual(changes.at(-1), { session: verified, error: '', checking: false })
  assert.ok(changes.some(change => change.checking && change.session === null))

  emit('TOKEN_REFRESHED', { ...normalSession, access_token: 'renewed-fixture-access-token' })
  await flush()
  assert.equal(changes.at(-1).session.accessToken, 'renewed-fixture-access-token')
  assert.equal(identityRequests.at(-1), 'Bearer renewed-fixture-access-token')
  assert.equal((await getAuthenticatedSession()).accessToken, 'renewed-fixture-access-token')

  // Recovery uses the separate service flow and must never become a normal login.
  const callsBeforeRecovery = identityRequests.length
  emit('PASSWORD_RECOVERY', normalSession)
  await flush()
  assert.equal(changes.at(-1).session, null)
  assert.equal(identityRequests.length, callsBeforeRecovery)

  globalThis.fetch = async () => {
    throw new Error('Private network information')
  }
  emit('TOKEN_REFRESHED', normalSession)
  await flush()
  assert.equal(changes.at(-1).session, null)
  assert.match(changes.at(-1).error, /Cannot reach/)
  assert.equal(
    savedSession,
    normalSession,
    'A network outage must not destroy a refreshable session',
  )

  globalThis.fetch = async () => reply({ message: 'Invalid or expired access token' }, 401)
  emit('SIGNED_IN', normalSession)
  await flush()
  assert.equal(changes.at(-1).session, null)
  assert.equal(savedSession, null)
  assert.equal(signOutScopes.at(-1), 'local')
  stopWatching()

  savedSession = null
  changes.length = 0
  stopWatching = watchAuthSession((session, error, checking) =>
    changes.push({ session, error, checking }),
  )
  await flush()
  assert.deepEqual(changes.at(-1), { session: null, error: '', checking: false })
  restoreError = { message: 'Invalid refresh token' }
  emit('TOKEN_REFRESHED', null)
  await flush()
  assert.equal(changes.at(-1).session, null)
  assert.match(changes.at(-1).error, /saved session could not be restored/)
  restoreError = null
  stopWatching()

  savedSession = normalSession
  signOutError = { message: 'Private token details' }
  await assert.rejects(logoutFarmer(), /Could not sign out.*saved session may still be active/)
  assert.equal(savedSession, normalSession, 'A failed sign-out must not be claimed as successful')
  signOutError = null
  await logoutFarmer()
  assert.equal(savedSession, null)
  assert.equal(signOutScopes.at(-1), 'local')
  assert.equal(await getAuthenticatedSession(), null)

  // A slow identity check must not resurrect a session after logout.
  let finishIdentity
  globalThis.fetch = () =>
    new Promise(resolve => {
      finishIdentity = resolve
    })
  savedSession = normalSession
  changes.length = 0
  stopWatching = watchAuthSession((session, error, checking) =>
    changes.push({ session, error, checking }),
  )
  await flush()
  assert.equal(typeof finishIdentity, 'function')
  await logoutFarmer()
  await flush()
  finishIdentity(reply(user))
  await flush()
  assert.equal(changes.at(-1).session, null)
  stopWatching()
  assert.equal(listeners.size, 0)

  globalThis.fetch = async url => reply(String(url).endsWith('/login') ? sessionResponse : user)
  saveError = { message: 'Private SDK error' }
  await assert.rejects(loginFarmer(login), /browser session could not be saved/)
  saveError = null
  const clientSource = await readFile(
    new URL('../src/services/supabase.ts', import.meta.url),
    'utf8',
  )
  assert.match(clientSource, /persistSession: true/)
  assert.match(clientSource, /autoRefreshToken: true/)
  assert.match(clientSource, /detectSessionInUrl: false/)
  assert.ok(!/localStorage|sessionStorage|console\./.test(clientSource))
  console.log(
    'PASS: SDK session save/restore, verified-only navigation, missing/invalid sessions, renewed token use, safe outage handling, local logout success/failure, recovery isolation, stale-request protection and subscription cleanup (mocked SDK).',
  )
  const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(appSource, /await logoutFarmer\(\)/)
  assert.match(appSource, /watchAuthSession/)
  const navbarSource = await readFile(
    new URL('../src/components/Navbar.tsx', import.meta.url),
    'utf8',
  )
  assert.match(navbarSource, /await auth.signOut\(\)/)
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
    'Manual browser checks remain: actual submit/loading/error interactions, disabled controls, focus, refresh persistence, automatic renewal, logout, recovery email and responsive appearance. Live Supabase was not contacted.',
  )
} finally {
  globalThis.fetch = originalFetch
  if (originalClientFixture === undefined) delete globalThis.__farmMarketAuthFixture
  else globalThis.__farmMarketAuthFixture = originalClientFixture
  await server.close()
}
