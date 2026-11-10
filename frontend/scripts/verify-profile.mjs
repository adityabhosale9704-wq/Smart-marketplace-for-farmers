import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const user = { id: 'profile-owner', email: 'owner@example.test' }
let savedSession = { user, access_token: 'profile-fixture-access-token' }
const originalFetch = globalThis.fetch
const originalClient = globalThis.__profileAuthFixture
// Mock only the SDK boundary; profile requests still run through the real API service.
globalThis.__profileAuthFixture = {
  auth: {
    async getSession() {
      return { data: { session: savedSession }, error: null }
    },
  },
}
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  plugins: [
    {
      name: 'mock-profile-auth',
      enforce: 'pre',
      load(id) {
        if (id.replaceAll('\\', '/').endsWith('/src/services/supabase.ts'))
          return 'export default globalThis.__profileAuthFixture'
      },
    },
  ],
})
try {
  const load = path => server.ssrLoadModule('/src/' + path)
  const { mockProfile } = await load('data/mockProfile.ts')
  const { validateProfile, profileFieldLimits } = await load('utils/profileValidation.ts')
  const { default: Profile } = await load('pages/Profile.tsx')
  const { default: Card } = await load('components/profile/ProfileCard.tsx')
  const { default: Form } = await load('components/profile/EditProfileForm.tsx')
  const { default: Navigation } = await load('components/profile/AccountNavigation.tsx')
  const { default: Settings } = await load('components/profile/AccountSettings.tsx')
  const { CartContext } = await load('context/cartContextValue.ts')
  const { AuthContext } = await load('context/authContextValue.ts')
  const { requestProfile } = await load('services/profile.ts')
  const original = JSON.stringify(mockProfile)
  assert.deepEqual(validateProfile(mockProfile).errors, {})
  const edited = validateProfile({
    ...mockProfile,
    fullName: '  Another   Farmer ',
    mobile: '9876543210',
    city: ' Another Village ',
  })
  assert.deepEqual(edited.errors, {})
  assert.equal(edited.profile.fullName, 'Another Farmer')
  assert.equal(edited.profile.city, 'Another Village')
  for (const field of ['fullName', 'city', 'district', 'state', 'pinCode'])
    assert.ok(validateProfile({ ...mockProfile, [field]: '  ' }).errors[field], field)
  for (const mobile of ['1234', '1234567890', '9XXXXXXXXX', '+919876543210', 'abcdefghij'])
    assert.ok(validateProfile({ ...mockProfile, mobile }).errors.mobile)
  for (const pinCode of ['012345', '12345', '1234567', 'abcdef'])
    assert.ok(validateProfile({ ...mockProfile, pinCode }).errors.pinCode)
  for (const fullName of ['A', '123', '<script>'])
    assert.ok(validateProfile({ ...mockProfile, fullName }).errors.fullName)
  for (const [field, length] of Object.entries(profileFieldLimits)) {
    if (field !== 'email')
      assert.ok(validateProfile({ ...mockProfile, [field]: 'x'.repeat(length + 1) }).errors[field])
  }
  assert.deepEqual(
    validateProfile({ ...mockProfile, email: '' }).errors,
    {},
    'Read-only Auth email must not block profile editing',
  )

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
  const render = (element, auth = { session: null, checking: false, async signOut() {} }) =>
    renderToStaticMarkup(
      createElement(
        CartContext.Provider,
        { value: cart },
        createElement(
          AuthContext.Provider,
          { value: auth },
          createElement(MemoryRouter, { initialEntries: ['/profile'] }, element),
        ),
      ),
    )
  const html = render(createElement(Profile))
  assert.match(html, /log in/)
  assert.ok(!html.includes('Sample Farmer'))
  assert.ok(!html.includes('farmer@example.com'))
  assert.ok(!html.includes('<form'))
  const checking = render(createElement(Profile), {
    session: null,
    checking: true,
    async signOut() {},
  })
  assert.match(checking, /Checking your session/)
  const loading = render(createElement(Profile), {
    session: { user, accessToken: savedSession.access_token },
    checking: false,
    async signOut() {},
  })
  assert.match(loading, /Loading your profile/)
  assert.ok(!loading.includes('Sample Farmer'))

  const reply = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  let result = {
    profile: { ...mockProfile, fullName: 'Loaded Farmer', email: user.email, mobile: '' },
    needsCompletion: false,
  }
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    assert.equal(options.headers.Authorization, `Bearer ${savedSession.access_token}`)
    if (String(url).endsWith('/api/auth/me')) return reply(user)
    assert.equal(String(url), 'http://127.0.0.1:5000/api/profile')
    return reply(result)
  }
  const controller = new AbortController()
  const loaded = await requestProfile('GET', user.id, undefined, controller.signal)
  assert.deepEqual(loaded, result)
  assert.equal(calls.at(-1).options.method, 'GET')
  assert.equal(calls.at(-1).options.body, undefined)
  assert.equal(calls.at(-1).options.signal, controller.signal)
  const card = render(createElement(Card, { profile: loaded.profile, onEdit() {} }))
  for (const text of ['Loaded Farmer', user.email, 'Not provided', 'Edit Profile'])
    assert.ok(card.includes(text), text)
  assert.ok(!card.includes('9XXXXXXXXX'))
  assert.ok(!card.includes('No farmer is signed in'))
  const form = render(createElement(Form, { profile: loaded.profile, onSave() {}, onCancel() {} }))
  assert.equal((form.match(/<input /g) || []).length, 7)
  assert.match(form, /Save Profile/)
  const emailInput = form.match(/<input[^>]*name="email"[^>]*>/)?.[0]
  assert.ok(emailInput)
  assert.match(emailInput, /readonly=""/i)
  assert.ok(!form.includes('Save Demo'))
  const saving = render(
    createElement(Form, { profile: loaded.profile, saving: true, onSave() {}, onCancel() {} }),
  )
  assert.match(saving, /<fieldset disabled/)
  assert.match(saving, /Saving/)
  await requestProfile(
    'PUT',
    user.id,
    { ...loaded.profile, email: 'must-not-be-sent@example.test' },
    controller.signal,
  )
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), {
    fullName: loaded.profile.fullName,
    mobile: '',
    city: loaded.profile.city,
    district: loaded.profile.district,
    state: loaded.profile.state,
    pinCode: loaded.profile.pinCode,
  })
  assert.ok(calls.every(call => call.options.cache === 'no-store'))
  savedSession = { user, access_token: 'renewed-profile-fixture-token' }
  await requestProfile('GET', user.id)
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer renewed-profile-fixture-token')
  const beforeWrongAccount = calls.filter(call => call.url.endsWith('/api/profile')).length
  await assert.rejects(
    requestProfile('PUT', 'a-different-account', loaded.profile),
    /account changed/,
  )
  assert.equal(calls.filter(call => call.url.endsWith('/api/profile')).length, beforeWrongAccount)

  result = {
    profile: {
      fullName: 'Registered Farmer',
      email: user.email,
      mobile: '',
      city: '',
      district: '',
      state: '',
      pinCode: '',
    },
    needsCompletion: true,
  }
  const incomplete = await requestProfile('GET', user.id)
  assert.equal(incomplete.needsCompletion, true)
  const completionForm = render(
    createElement(Form, { profile: incomplete.profile, onSave() {}, onCancel() {} }),
  )
  assert.match(completionForm, /value="Registered Farmer"/)
  assert.match(completionForm, /name="city"[^>]*value=""/)
  const beforeLoggedOut = calls.length
  savedSession = null
  await assert.rejects(requestProfile('GET', user.id), /Please log in/)
  assert.equal(calls.length, beforeLoggedOut)
  savedSession = { user, access_token: 'profile-fixture-token' }
  for (const status of [401, 503]) {
    globalThis.fetch = async url =>
      String(url).endsWith('/api/auth/me')
        ? reply(user)
        : reply({ message: 'Safe profile error' }, status)
    await assert.rejects(
      requestProfile('GET', user.id),
      error => error.status === status && error.message === 'Safe profile error',
    )
    await assert.rejects(requestProfile('PUT', user.id, loaded.profile), /Safe profile error/)
  }
  globalThis.fetch = async () => {
    throw new Error('Private network information')
  }
  await assert.rejects(requestProfile('GET', user.id), /Cannot reach the authentication server/)
  globalThis.fetch = async url => reply(String(url).endsWith('/api/auth/me') ? user : {})
  await assert.rejects(requestProfile('GET', user.id), /profile response was incomplete/)
  const navigation = render(createElement(Navigation))
  for (const route of [
    '/marketplace',
    '/cart',
    '/my-orders',
    '/seller/dashboard',
    '/seller/add-product',
    '/seller/products',
    '/seller/orders',
  ])
    assert.ok(navigation.includes('href="' + route + '"'))
  const settings = render(createElement(Settings))
  assert.equal((settings.match(/disabled=""/g) || []).length, 3)
  assert.ok(settings.includes('Coming Soon'))
  assert.ok(!settings.includes('No account is signed in'))
  for (const path of [
    'pages/Profile.tsx',
    'components/profile/EditProfileForm.tsx',
    'utils/profileValidation.ts',
    'services/profile.ts',
  ]) {
    const source = await readFile(new URL('../src/' + path, import.meta.url), 'utf8')
    assert.ok(!/localStorage|sessionStorage|document\.cookie|fetch\(|console\./.test(source))
  }
  const source = await readFile(new URL('../src/pages/Profile.tsx', import.meta.url), 'utf8')
  assert.ok(!source.includes('mockProfile'))
  assert.match(source, /loaded\?\.userId === userId/)
  assert.match(source, /controller.signal.aborted/)
  assert.match(source, /setEditing\(result.needsCompletion\)/)
  assert.equal(JSON.stringify(mockProfile), original)
  console.log(
    'PASS: profile validation, logged-out/checking/loading states, private loaded card, read-only email, completion form, saving controls, seven links, unfinished settings, mocked GET/PUT payloads, current-token use, missing authentication and safe errors. No live profile data changed.',
  )
  console.log(
    'Manual browser checks remain: actual async profile load, first save/reload, Edit/Save/Cancel/Escape/focus, logout/account switching, session renewal during editing, responsive layouts and live RLS permissions.',
  )
} finally {
  globalThis.fetch = originalFetch
  if (originalClient === undefined) delete globalThis.__profileAuthFixture
  else globalThis.__profileAuthFixture = originalClient
  await server.close()
}
