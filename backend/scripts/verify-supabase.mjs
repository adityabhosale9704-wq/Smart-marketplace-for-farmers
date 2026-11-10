import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout } from 'node:timers/promises'

// This local HTTP fixture never contacts Supabase or uses real credentials.
let mode = 'empty'
let queryCount = 0
let authMode = 'valid'
let authCount = 0
// Unsigned fixture only: the local Auth server, not Supabase, accepts this token.
const testToken = [
  { alg: 'HS256', typ: 'JWT' },
  { sub: 'verified-user', exp: Math.floor(Date.now() / 1000) + 3600 },
  'fixture-signature',
]
  .map(value =>
    Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url'),
  )
  .join('.')
let updateMode = 'success'
let updateCount = 0
const testPassword = 'Test123!'
const signupSessionToken = 'local-session-token-not-a-jwt'
let signupMode = 'confirmation'
let signupCount = 0
let loginMode = 'valid'
let loginCount = 0
let recoveryMode = 'success'
let recoveryCount = 0
const loginAccessToken = 'login-test-access-token-not-a-real-jwt'
const loginRefreshToken = 'login-test-refresh-token-placeholder'
const profileRows = new Map()
const profileRequests = []
let profileMode = 'normal'
const productRows = new Map()
let productMode = 'normal'
let productCount = 0
let publicProductMode = 'normal'
let sellerNameMode = 'normal'
let publicQueryCount = 0
const database = createServer((request, response) => {
  if (request.url === '/rest/v1/rpc/marketplace_seller_names') {
    assert.equal(request.method, 'POST')
    assert.ok(
      ![`Bearer ${testToken}`, `Bearer ${loginAccessToken}`].includes(
        request.headers.authorization,
      ),
    )
    let body = ''
    request.on('data', chunk => {
      body += chunk
    })
    request.on('end', () => {
      const { seller_ids } = JSON.parse(body)
      assert.ok(Array.isArray(seller_ids))
      response.setHeader('Content-Type', 'application/json')
      if (sellerNameMode !== 'normal') {
        response.statusCode = sellerNameMode === 'missing' ? 404 : 500
        return response.end(
          JSON.stringify({
            code: sellerNameMode === 'missing' ? 'PGRST202' : 'XX000',
            message: 'Private seller error details',
          }),
        )
      }
      const visibleSellers = new Set(
        [...productRows.values()]
          .filter(row => row.listing_status === 'published' && row.available_quantity > 0)
          .map(row => row.seller_id),
      )
      response.end(
        JSON.stringify(
          seller_ids
            .filter(id => visibleSellers.has(id))
            .map(id => ({
              seller_id: id,
              full_name: id === 'verified-user' ? 'Visible Farmer' : 'Another Grower',
            })),
        ),
      )
    })
    return
  }
  if (request.url.startsWith('/rest/v1/products?')) {
    const url = new URL(request.url, 'http://localhost')
    if (url.searchParams.get('listing_status') === 'eq.published') {
      publicQueryCount++
      assert.equal(request.method, 'GET')
      assert.equal(url.searchParams.get('available_quantity'), 'gt.0')
      assert.ok(
        ![`Bearer ${testToken}`, `Bearer ${loginAccessToken}`].includes(
          request.headers.authorization,
        ),
      )
      assert.ok(!url.searchParams.has('or'))
      assert.ok(!url.searchParams.has('seller_id'))
      response.setHeader('Content-Type', 'application/json')
      if (publicProductMode === 'error') {
        response.statusCode = 403
        return response.end(
          JSON.stringify({ code: '42501', message: 'Private product error information' }),
        )
      }
      let rows = [...productRows.values()].filter(
        row => row.listing_status === 'published' && row.available_quantity > 0,
      )
      if (url.searchParams.get('select') === 'city')
        return response.end(JSON.stringify(rows.map(row => ({ city: row.city }))))
      assert.equal(
        url.searchParams.get('select'),
        'id,seller_id,name,description,category,price,unit,available_quantity,city,district,state,image_path',
      )
      if (url.searchParams.has('name')) {
        const pattern = url.searchParams.get('name')
        assert.ok(pattern.startsWith('ilike.%') && pattern.endsWith('%'))
        const term = pattern
          .slice(7, -1)
          .replace(/\\([\\%_])/g, '$1')
          .toLowerCase()
        rows = rows.filter(row => row.name.toLowerCase().includes(term))
      }
      if (url.searchParams.has('category'))
        rows = rows.filter(row => 'eq.' + row.category === url.searchParams.get('category'))
      if (url.searchParams.has('city'))
        rows = rows.filter(row => 'eq.' + row.city === url.searchParams.get('city'))
      for (const bound of url.searchParams.getAll('price')) {
        const amount = Number(bound.slice(4))
        rows = rows.filter(row =>
          bound.startsWith('gte.') ? row.price >= amount : row.price <= amount,
        )
      }
      const keys = url.searchParams.get('select').split(',')
      return response.end(
        JSON.stringify(
          rows.reverse().map(row => Object.fromEntries(keys.map(key => [key, row[key]]))),
        ),
      )
    }
  }
  if (request.url.startsWith('/rest/v1/products?') && !request.url.includes('select=id&limit=1')) {
    const url = new URL(request.url, 'http://localhost')
    const owner =
      request.headers.authorization === `Bearer ${testToken}` ? 'verified-user' : 'login-user'
    assert.ok(
      [`Bearer ${testToken}`, `Bearer ${loginAccessToken}`].includes(request.headers.authorization),
    )
    assert.equal(request.headers.apikey, 'sb_publishable_test_placeholder')
    if (request.method !== 'POST') assert.equal(url.searchParams.get('seller_id'), `eq.${owner}`)
    productCount++
    if (productMode === 'network-error') return request.socket.destroy()
    response.setHeader('Content-Type', 'application/json')
    if (productMode === 'error') {
      response.statusCode = 403
      return response.end(
        JSON.stringify({ code: '42501', message: 'Private product database details' }),
      )
    }
    let rows = [...productRows.values()].filter(row => row.seller_id === owner)
    const id = url.searchParams.get('id')?.slice(3)
    if (id) rows = rows.filter(row => row.id === id)
    if (request.method === 'GET') {
      if (!id) assert.equal(url.searchParams.get('order'), 'created_at.desc')
      return response.end(JSON.stringify(rows.reverse()))
    }
    let body = ''
    request.on('data', chunk => {
      body += chunk
    })
    request.on('end', () => {
      const values = JSON.parse(body)
      assert.equal(typeof values.price, 'string')
      assert.equal(typeof values.available_quantity, 'string')
      assert.ok(!('image_path' in values))
      if (request.method === 'POST') {
        assert.equal(values.seller_id, owner)
        assert.ok(profileRows.has(owner))
        assert.deepEqual(
          Object.keys(values).sort(),
          [
            'seller_id',
            'name',
            'category',
            'description',
            'price',
            'unit',
            'available_quantity',
            'city',
            'district',
            'state',
            'harvest_date',
            'listing_status',
          ].sort(),
        )
        const id = '00000000-0000-4000-8000-' + String(productRows.size + 1).padStart(12, '0')
        const row = {
          ...values,
          id,
          image_path: null,
          created_at: new Date(productRows.size * 1000).toISOString(),
          price: Number(values.price),
          available_quantity: Number(values.available_quantity),
        }
        productRows.set(id, row)
        return response.end(JSON.stringify(row))
      }
      assert.equal(request.method, 'PATCH')
      assert.deepEqual(
        Object.keys(values).sort(),
        ['name', 'price', 'available_quantity', 'listing_status'].sort(),
      )
      if (!rows.length) return response.end('[]')
      const row = {
        ...rows[0],
        ...values,
        price: Number(values.price),
        available_quantity: Number(values.available_quantity),
      }
      productRows.set(row.id, row)
      response.end(JSON.stringify([row]))
    })
    return
  }
  if (request.url.startsWith('/rest/v1/profiles?')) {
    const url = new URL(request.url, 'http://localhost')
    const owner =
      request.headers.authorization === `Bearer ${testToken}` ? 'verified-user' : 'login-user'
    assert.ok(
      [`Bearer ${testToken}`, `Bearer ${loginAccessToken}`].includes(request.headers.authorization),
    )
    assert.equal(request.headers.apikey, 'sb_publishable_test_placeholder')
    assert.ok(
      ['id', 'full_name,mobile,city,district,state,pin_code'].includes(
        url.searchParams.get('select'),
      ),
    )
    if (request.method !== 'POST') assert.equal(url.searchParams.get('id'), `eq.${owner}`)
    profileRequests.push({ owner, method: request.method })
    if (profileMode === 'network-error') return request.socket.destroy()
    response.setHeader('Content-Type', 'application/json')
    if (profileMode === 'error' || profileMode === 'expired') {
      response.statusCode = profileMode === 'expired' ? 401 : 403
      return response.end(
        JSON.stringify({ code: '42501', message: 'Private database information' }),
      )
    }
    if (request.method === 'GET' && url.searchParams.get('select') === 'id')
      return response.end(JSON.stringify(profileRows.has(owner) ? [{ id: owner }] : []))
    if (request.method === 'GET')
      return response.end(JSON.stringify(profileRows.has(owner) ? [profileRows.get(owner)] : []))
    let body = ''
    request.on('data', chunk => {
      body += chunk
    })
    request.on('end', () => {
      const values = JSON.parse(body)
      const columns = ['full_name', 'mobile', 'city', 'district', 'state', 'pin_code']
      assert.deepEqual(
        Object.keys(values).sort(),
        (request.method === 'POST' ? [...columns, 'id'] : columns).sort(),
      )
      if (request.method === 'POST') {
        assert.equal(values.id, owner)
        if (profileMode === 'race') {
          profileRows.set(owner, {})
          response.statusCode = 409
          return response.end(
            JSON.stringify({ code: '23505', message: 'Private duplicate information' }),
          )
        }
        assert.ok(!profileRows.has(owner), 'A profile must not be duplicated')
        profileRows.set(owner, values)
      } else {
        assert.equal(request.method, 'PATCH')
        if (profileRows.has(owner)) profileRows.set(owner, { ...profileRows.get(owner), ...values })
      }
      response.end(JSON.stringify(profileRows.get(owner) ?? null))
    })
    return
  }
  if (request.url === '/auth/v1/user' && request.method === 'PUT') {
    assert.equal(request.headers.authorization, `Bearer ${testToken}`)
    updateCount++
    let body = ''
    request.on('data', chunk => {
      body += chunk
    })
    request.on('end', () => {
      assert.deepEqual(JSON.parse(body), {
        password: 'NewPassword123!',
        code_challenge: null,
        code_challenge_method: null,
      })
      if (updateMode === 'network-error') return request.socket.destroy()
      response.setHeader('Content-Type', 'application/json')
      if (typeof updateMode === 'number') {
        response.statusCode = updateMode
        return response.end(JSON.stringify({ message: `Private details ${testToken}` }))
      }
      response.end(JSON.stringify({ id: 'verified-user', email: 'farmer@example.com' }))
    })
    return
  }
  if (request.url.startsWith('/auth/v1/recover?')) {
    const url = new URL(request.url, 'http://localhost')
    assert.equal(url.searchParams.get('redirect_to'), 'http://127.0.0.1:5173/reset-password')
    assert.equal(request.method, 'POST')
    assert.notEqual(request.headers.authorization, `Bearer ${loginAccessToken}`)
    recoveryCount++
    let body = ''
    request.on('data', chunk => {
      body += chunk
    })
    request.on('end', () => {
      assert.equal(JSON.parse(body).email, 'farmer@example.com')
      if (recoveryMode === 'network-error') return request.socket.destroy()
      response.setHeader('Content-Type', 'application/json')
      if (typeof recoveryMode === 'object') {
        response.statusCode = recoveryMode.status
        response.setHeader('X-Supabase-Api-Version', '2024-01-01')
        return response.end(
          JSON.stringify({ code: recoveryMode.code, msg: `Private details ${testToken}` }),
        )
      }
      response.end('{}')
    })
    return
  }
  if (request.url === '/auth/v1/signup') {
    assert.equal(request.method, 'POST')
    assert.notEqual(request.headers.authorization, `Bearer ${signupSessionToken}`)
    signupCount++
    let body = ''
    request.on('data', chunk => {
      body += chunk
    })
    request.on('end', () => {
      const input = JSON.parse(body)
      assert.equal(input.email, 'farmer@example.com')
      assert.equal(input.password, testPassword)
      assert.deepEqual(input.data, { fullName: 'Sample Farmer' })
      if (signupMode === 'network-error') return request.socket.destroy()
      response.setHeader('Content-Type', 'application/json')
      if (typeof signupMode === 'object') {
        response.statusCode = signupMode.status
        response.setHeader('X-Supabase-Api-Version', '2024-01-01')
        return response.end(
          JSON.stringify({ code: signupMode.code, msg: `Private details ${testPassword}` }),
        )
      }
      const user = {
        id: 'signup-user',
        email: input.email,
        identities: signupMode === 'obfuscated' ? [] : [{ provider: 'email' }],
      }
      if (signupMode === 'no-confirmation') {
        return response.end(
          JSON.stringify({
            access_token: signupSessionToken,
            refresh_token: 'local-refresh-token-placeholder',
            expires_in: 3600,
            token_type: 'bearer',
            user,
          }),
        )
      }
      response.end(JSON.stringify(user))
    })
    return
  }
  if (request.url === '/auth/v1/token?grant_type=password') {
    assert.equal(request.method, 'POST')
    assert.notEqual(request.headers.authorization, `Bearer ${signupSessionToken}`)
    assert.notEqual(request.headers.authorization, `Bearer ${loginAccessToken}`)
    loginCount++
    let body = ''
    request.on('data', chunk => {
      body += chunk
    })
    request.on('end', () => {
      const input = JSON.parse(body)
      assert.equal(input.email, 'farmer@example.com')
      assert.equal(input.password, testPassword)
      if (loginMode === 'network-error') return request.socket.destroy()
      response.setHeader('Content-Type', 'application/json')
      if (typeof loginMode === 'object') {
        response.statusCode = loginMode.status
        response.setHeader('X-Supabase-Api-Version', '2024-01-01')
        return response.end(
          JSON.stringify({
            code: loginMode.code,
            msg: `Private details ${testPassword} ${loginAccessToken} ${loginRefreshToken}`,
          }),
        )
      }
      const session = {
        access_token: loginAccessToken,
        refresh_token: loginRefreshToken,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'login-user', email: 'farmer@example.com', user_metadata: { private: true } },
      }
      if (loginMode === 'missing-session')
        return response.end(JSON.stringify({ user: session.user }))
      if (loginMode === 'missing-refresh') delete session.refresh_token
      response.end(JSON.stringify(session))
    })
    return
  }
  assert.equal(request.method, 'GET')
  if (request.url === '/auth/v1/user') {
    authCount++
    if (request.headers.authorization === 'Bearer invalid-token') {
      response.statusCode = 401
      response.setHeader('Content-Type', 'application/json')
      return response.end(JSON.stringify({ message: 'Invalid token' }))
    }
    assert.ok(
      [`Bearer ${testToken}`, `Bearer ${loginAccessToken}`].includes(request.headers.authorization),
    )
    if (authMode === 'network-error') return request.socket.destroy()
    response.setHeader('Content-Type', 'application/json')
    if (typeof authMode === 'number') {
      response.statusCode = authMode
      return response.end(JSON.stringify({ message: `Private details: ${testToken}` }))
    }
    return response.end(
      JSON.stringify({
        id:
          request.headers.authorization === `Bearer ${loginAccessToken}`
            ? 'login-user'
            : authMode === 'second-user'
              ? 'second-verified-user'
              : 'verified-user',
        email: 'farmer@example.com',
        user_metadata: { private: 'must not be returned', fullName: 'Registered Farmer' },
      }),
    )
  }
  assert.equal(request.url, '/rest/v1/products?select=id&limit=1')
  assert.notEqual(request.headers.authorization, `Bearer ${testToken}`)
  assert.notEqual(request.headers.authorization, `Bearer ${signupSessionToken}`)
  assert.notEqual(request.headers.authorization, `Bearer ${loginAccessToken}`)
  queryCount++
  if (mode === 'network-error') return request.socket.destroy()
  response.setHeader('Content-Type', 'application/json')
  response.statusCode = mode === 'error' ? 401 : 200
  response.end(
    JSON.stringify(
      mode === 'error'
        ? { message: 'Private upstream details' }
        : mode === 'empty'
          ? []
          : [{ id: 'sample-product' }],
    ),
  )
})
database.listen(0, '127.0.0.1')
await once(database, 'listening')

const environment = {
  ...process.env,
  SUPABASE_URL: `http://127.0.0.1:${database.address().port}`,
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_placeholder',
  FRONTEND_ORIGIN: 'http://127.0.0.1:5173',
}

const missing = { ...environment }
delete missing.SUPABASE_URL
delete missing.SUPABASE_PUBLISHABLE_KEY
for (const [env, message] of [
  [missing, /Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY/],
  [
    { ...environment, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test_placeholder' },
    /must be a publishable key/,
  ],
  [{ ...environment, SUPABASE_URL: 'invalid-url' }, /must be a valid HTTP or HTTPS project URL/],
]) {
  const result = spawnSync(process.execPath, ['src/server.js'], {
    env,
    encoding: 'utf8',
    timeout: 5000,
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, message)
}

const reservation = createServer()
reservation.listen(0, '127.0.0.1')
await once(reservation, 'listening')
const port = reservation.address().port
await new Promise(resolve => reservation.close(resolve))
const backend = spawn(process.execPath, ['src/server.js'], {
  env: { ...environment, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let output = ''
backend.stdout.on('data', data => {
  output += data
})
backend.stderr.on('data', data => {
  output += data
})
const base = `http://127.0.0.1:${port}`

try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      ready = (await fetch(`${base}/api/health`)).status === 200
    } catch {}
    if (ready) break
    if (backend.exitCode !== null) throw new Error(output)
    await setTimeout(100)
  }
  assert.ok(ready, 'Backend did not start')
  const health = await fetch(`${base}/api/health`)
  assert.deepEqual(await health.json(), { status: 'ok', message: 'FarmMarket API is running' })
  for (mode of ['empty', 'populated', 'error', 'network-error']) {
    const response = await fetch(`${base}/api/db-health`)
    const failed = mode === 'error' || mode === 'network-error'
    assert.equal(response.status, failed ? 503 : 200)
    assert.deepEqual(
      await response.json(),
      failed
        ? { status: 'error', message: 'Database connection unavailable' }
        : { status: 'ok', message: 'Database connection is working' },
    )
  }
  assert.ok(queryCount >= 4)

  for (const authorization of [
    undefined,
    'Basic example',
    'Bearer',
    'Bearer ',
    'Bearer two tokens',
    'Bearer token,other',
    'Bearer  token',
  ]) {
    const response = await fetch(`${base}/api/auth/me`, {
      headers: authorization === undefined ? {} : { Authorization: authorization },
    })
    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { message: 'A Bearer access token is required' })
  }
  assert.equal(authCount, 0, 'Malformed headers must not reach Supabase')

  for (authMode of [401, 403, 422, 400, 429, 500, 503, 'network-error', 'valid', 'second-user']) {
    const response = await fetch(`${base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testToken}` },
    })
    const invalid = [400, 401, 403, 422].includes(authMode)
    const valid = authMode === 'valid' || authMode === 'second-user'
    assert.equal(response.status, valid ? 200 : invalid ? 401 : 503)
    assert.deepEqual(
      await response.json(),
      valid
        ? {
            id: authMode === 'second-user' ? 'second-verified-user' : 'verified-user',
            email: 'farmer@example.com',
          }
        : {
            message: invalid
              ? 'Invalid or expired access token'
              : 'Authentication service unavailable',
          },
    )
  }
  assert.ok(authCount >= 10)
  assert.ok(!output.includes(testToken), 'Token must not appear in backend logs')
  assert.ok(!output.includes('Private details'), 'Upstream errors must not appear in backend logs')
  assert.equal((await fetch(`${base}/api/auth/me`)).status, 401)

  const registration = {
    fullName: '  Sample   Farmer  ',
    email: ' Farmer@Example.com ',
    password: testPassword,
  }
  for (const input of [
    {},
    null,
    [],
    { ...registration, fullName: undefined },
    { ...registration, email: undefined },
    { ...registration, password: undefined },
    { ...registration, fullName: 'A' },
    { ...registration, fullName: 'A'.repeat(101) },
    { ...registration, fullName: {} },
    { ...registration, email: 'not-an-email' },
    { ...registration, email: 'a@b..com' },
    { ...registration, email: 123 },
    { ...registration, password: '1234567' },
    { ...registration, password: ' '.repeat(8) },
    { ...registration, password: 12345678 },
    { ...registration, password: 'x'.repeat(129) },
  ]) {
    const response = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    assert.equal(response.status, 400)
  }
  assert.equal(signupCount, 0, 'Invalid registration must not reach Supabase')

  const accepted = {
    message:
      'Registration request received. If email confirmation is required, check your email. You are not signed in.',
  }
  for (signupMode of [
    'confirmation',
    'no-confirmation',
    'obfuscated',
    { status: 422, code: 'user_already_exists' },
    { status: 400, code: 'email_exists' },
    { status: 422, code: 'weak_password' },
    { status: 429, code: 'over_request_rate_limit' },
    { status: 503, code: 'unexpected_failure' },
    'network-error',
  ]) {
    const response = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
    })
    const duplicate = ['user_already_exists', 'email_exists'].includes(signupMode.code)
    const success =
      ['confirmation', 'no-confirmation', 'obfuscated'].includes(signupMode) || duplicate
    const status = success
      ? 200
      : signupMode.status === 422
        ? 400
        : signupMode.status === 429
          ? 429
          : 503
    assert.equal(response.status, status)
    const body = await response.json()
    if (success) assert.deepEqual(body, accepted)
    else
      assert.deepEqual(body, {
        message:
          status === 400
            ? 'Registration could not be completed. Check your details and password requirements.'
            : status === 429
              ? 'Too many registration attempts. Try again later.'
              : 'Registration service unavailable. Try again later.',
      })
    assert.equal(response.headers.get('set-cookie'), null)
    assert.ok(!JSON.stringify(body).includes(testPassword))
    assert.ok(!JSON.stringify(body).includes(signupSessionToken))
    assert.equal((await fetch(`${base}/api/auth/me`)).status, 401)
    mode = 'empty'
    assert.equal((await fetch(`${base}/api/db-health`)).status, 200)
  }
  assert.ok(!output.includes(testPassword), 'Passwords must not appear in backend logs')
  assert.ok(!output.includes(signupSessionToken), 'Signup sessions must not appear in backend logs')

  const login = { email: ' Farmer@Example.com ', password: testPassword }
  for (const input of [
    {},
    null,
    [],
    { password: testPassword },
    { email: login.email },
    { ...login, email: '' },
    { ...login, email: 123 },
    { ...login, email: 'not-an-email' },
    { ...login, email: 'a@b..com' },
    { ...login, email: 'a'.repeat(255) + '@example.com' },
    { ...login, password: '' },
    { ...login, password: '   ' },
    { ...login, password: 123 },
    { ...login, password: 'x'.repeat(129) },
  ]) {
    const response = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    assert.equal(response.status, 400)
  }
  assert.equal(loginCount, 0, 'Invalid login input must not reach Supabase')

  for (loginMode of [
    'valid',
    { status: 400, code: 'invalid_credentials' },
    { status: 400, code: 'email_not_confirmed' },
    { status: 401, code: 'invalid_credentials' },
    { status: 429, code: 'over_request_rate_limit' },
    { status: 503, code: 'unexpected_failure' },
    'network-error',
    'missing-session',
    'missing-refresh',
  ]) {
    const response = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(login),
    })
    const rejected = [400, 401].includes(loginMode.status)
    const expectedStatus =
      loginMode === 'valid' ? 200 : rejected ? 401 : loginMode.status === 429 ? 429 : 503
    assert.equal(response.status, expectedStatus)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('set-cookie'), null)
    const body = await response.json()
    assert.ok(!JSON.stringify(body).includes(testPassword))
    if (loginMode === 'valid') {
      assert.deepEqual(body, {
        message: 'Login successful',
        user: { id: 'login-user', email: 'farmer@example.com' },
        accessToken: loginAccessToken,
        refreshToken: loginRefreshToken,
        expiresIn: 3600,
      })
      authMode = 'valid'
      const me = await fetch(`${base}/api/auth/me`, {
        headers: { Authorization: `Bearer ${body.accessToken}` },
      })
      assert.equal(me.status, 200)
      assert.deepEqual(await me.json(), body.user)
    } else {
      assert.deepEqual(body, {
        message: rejected
          ? 'Unable to sign in. Check your email and password, and confirm your email if required.'
          : expectedStatus === 429
            ? 'Too many login attempts. Try again later.'
            : 'Login service unavailable. Try again later.',
      })
      assert.ok(!JSON.stringify(body).includes(loginAccessToken))
      assert.ok(!JSON.stringify(body).includes(loginRefreshToken))
    }
    assert.equal((await fetch(`${base}/api/auth/me`)).status, 401)
    mode = 'empty'
    assert.equal((await fetch(`${base}/api/db-health`)).status, 200)
  }
  assert.ok(!output.includes(testPassword))
  assert.ok(!output.includes(loginAccessToken))
  assert.ok(!output.includes(loginRefreshToken))
  assert.ok(!output.includes('Private details'))

  mode = 'empty'
  assert.equal((await fetch(`${base}/api/db-health`)).status, 200)
  assert.equal((await fetch(`${base}/api/health`)).status, 200)
  for (const input of [
    {},
    null,
    [],
    { email: 42 },
    { email: '' },
    { email: 'bad' },
    { email: 'a@b..com' },
    { email: 'a'.repeat(255) + '@b.com' },
  ]) {
    const response = await fetch(`${base}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    assert.equal(response.status, 400)
  }
  assert.equal(recoveryCount, 0)
  for (recoveryMode of [
    'success',
    { status: 404, code: 'user_not_found' },
    { status: 429, code: 'over_email_send_rate_limit' },
    { status: 503, code: 'unexpected_failure' },
    'network-error',
  ]) {
    const response = await fetch(`${base}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ' Farmer@Example.com ' }),
    })
    const status =
      recoveryMode === 'success' || recoveryMode.code === 'user_not_found'
        ? 200
        : recoveryMode.status === 429
          ? 429
          : 503
    assert.equal(response.status, status)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), {
      message:
        status === 200
          ? 'If an account exists for this email, a password reset email will be sent.'
          : status === 429
            ? 'Too many recovery requests. Try again later.'
            : 'Password recovery unavailable. Try again later.',
    })
  }
  assert.ok(recoveryCount >= 5)
  assert.ok(!output.includes(testToken))
  assert.ok(!output.includes('Private details'))
  console.log(
    'PASS: recovery validation, isolated client, redirect URL, generic account privacy, rate limits and safe service/network errors. No real emails sent.',
  )
  const missingRoute = await fetch(`${base}/api/missing`)
  authMode = 'valid'
  const productRequest = (path, method = 'GET', body, token = testToken) =>
    fetch(`${base}/api/products${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  const validProduct = {
    name: 'Fresh Tomatoes',
    category: 'vegetables',
    description: 'Freshly harvested tomatoes from our farm.',
    price: '32.50',
    unit: 'kg',
    stock: '125.25',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    harvestDate: '',
    listingStatus: 'draft',
  }
  assert.equal((await fetch(`${base}/api/products`, { method: 'POST' })).status, 401)
  assert.equal((await productRequest('/mine', 'GET', undefined, 'invalid-token')).status, 401)
  assert.equal(
    (await productRequest('/00000000-0000-4000-8000-000000000001', 'PUT', {}, 'invalid-token'))
      .status,
    401,
  )
  profileRows.delete('verified-user')
  assert.equal((await productRequest('', 'POST', validProduct)).status, 409)
  const beforeInvalidProducts = productCount
  for (const input of [
    {},
    null,
    [],
    { ...validProduct, seller_id: 'other' },
    { ...validProduct, image_path: 'invented/path.jpg' },
    { ...validProduct, name: 'AB' },
    { ...validProduct, category: 'unsupported' },
    { ...validProduct, unit: 'litre' },
    { ...validProduct, description: 'short' },
    { ...validProduct, price: '1.001' },
    { ...validProduct, price: '0' },
    { ...validProduct, price: 32.5 },
    { ...validProduct, stock: '-1' },
    { ...validProduct, stock: '1000001' },
    { ...validProduct, city: '' },
    { ...validProduct, harvestDate: '2026-02-30' },
    { ...validProduct, harvestDate: '9999-01-01' },
    { ...validProduct, listingStatus: 'active' },
    { ...validProduct, listingStatus: 'published', stock: '0' },
  ]) {
    assert.equal((await productRequest('', 'POST', input)).status, 400)
  }
  assert.equal(productCount, beforeInvalidProducts)
  profileRows.set('verified-user', { id: 'verified-user' })
  profileRows.set('login-user', { id: 'login-user' })
  assert.deepEqual(await (await productRequest('/mine')).json(), [])
  const draftResponse = await productRequest('', 'POST', { ...validProduct, stock: '0' })
  assert.equal(draftResponse.status, 201)
  const draftProduct = await draftResponse.json()
  assert.equal(draftProduct.seller_id, 'verified-user')
  assert.equal(draftProduct.listing_status, 'draft')
  assert.equal(draftProduct.image_path, null)
  const publishedResponse = await productRequest('', 'POST', {
    ...validProduct,
    listingStatus: 'published',
  })
  assert.equal(publishedResponse.status, 201)
  const publishedProduct = await publishedResponse.json()
  assert.equal(publishedProduct.price, 32.5)
  assert.equal(publishedProduct.available_quantity, 125.25)
  const otherResponse = await productRequest('', 'POST', validProduct, loginAccessToken)
  assert.equal(otherResponse.status, 201)
  const otherProduct = await otherResponse.json()
  const ownProducts = await (await productRequest('/mine?seller_id=login-user')).json()
  assert.equal(ownProducts.length, 2)
  assert.equal(ownProducts[0].id, publishedProduct.id)
  assert.ok(ownProducts.every(row => row.seller_id === 'verified-user'))
  const editProduct = {
    name: 'Updated Tomatoes',
    price: '42.10',
    stock: '3.25',
    listingStatus: 'published',
  }
  assert.equal((await productRequest('/' + otherProduct.id, 'PUT', editProduct)).status, 404)
  assert.equal(
    (await productRequest('/' + draftProduct.id, 'PUT', { ...editProduct, seller_id: 'other' }))
      .status,
    400,
  )
  assert.equal(
    (await productRequest('/' + draftProduct.id, 'PUT', { ...editProduct, unit: 'quintal' }))
      .status,
    400,
  )
  assert.equal(
    (await productRequest('/' + draftProduct.id, 'PUT', { ...editProduct, stock: '0' })).status,
    400,
  )
  const editedProduct = await productRequest('/' + draftProduct.id, 'PUT', editProduct)
  assert.equal(editedProduct.status, 200)
  assert.equal((await editedProduct.json()).unit, 'kg')
  const outOfStock = await productRequest('/' + draftProduct.id, 'PUT', {
    ...editProduct,
    stock: '0',
  })
  assert.equal(outOfStock.status, 200)
  assert.equal((await outOfStock.json()).listing_status, 'published')
  for (productMode of ['error', 'network-error']) {
    const failed = await productRequest('', 'POST', validProduct)
    assert.equal(failed.status, 503)
    const text = await failed.text()
    assert.ok(!text.includes('Private'))
    if (productMode === 'error') assert.match(text, /migration/)
    assert.equal((await productRequest('/mine')).status, 503)
  }
  productMode = 'normal'
  const publicRowsBefore = JSON.stringify([...productRows.values()])
  const publicGet = query => fetch(`${base}/api/products${query ? '?' + query : ''}`)
  const invalidQueryCount = publicQueryCount
  for (const query of [
    'listing_status=draft',
    'search=a&search=b',
    'category=unknown',
    'minPrice=-1',
    'maxPrice=1.001',
    'minPrice=100&maxPrice=10',
    'maxPrice=1000001',
    'location=' + 'x'.repeat(101),
    'search=%00',
  ]) {
    assert.equal((await publicGet(query)).status, 400)
  }
  assert.equal(publicQueryCount, invalidQueryCount)
  const publicResponse = await publicGet('')
  assert.equal(publicResponse.status, 200)
  assert.equal(publicResponse.headers.get('cache-control'), 'no-store')
  const marketplace = await publicResponse.json()
  assert.equal(marketplace.products.length, 1)
  assert.equal(marketplace.products[0].id, publishedProduct.id)
  assert.equal(marketplace.products[0].seller_name, 'Visible Farmer')
  assert.equal(marketplace.sellerNamesAvailable, true)
  assert.deepEqual(marketplace.locations, ['Pune'])
  assert.ok(!JSON.stringify(marketplace).includes('email'))
  assert.ok(!JSON.stringify(marketplace).includes('mobile'))
  const asOwner = await fetch(`${base}/api/products`, {
    headers: { Authorization: `Bearer ${testToken}` },
  })
  assert.deepEqual(
    await asOwner.json(),
    marketplace,
    'An owner token must not broaden public visibility',
  )
  const filteredPublic = await publicGet(
    'search=tOmAtO&category=vegetables&location=Pune&minPrice=32.50&maxPrice=32.50',
  )
  assert.equal((await filteredPublic.json()).products.length, 1)
  for (const query of [
    'category=fruits',
    'location=OtherTown',
    'minPrice=33',
    'maxPrice=32',
    'search=missing',
    'search=%25',
  ]) {
    const result = await publicGet(query)
    assert.equal(result.status, 200)
    assert.deepEqual((await result.json()).products, [])
  }
  sellerNameMode = 'missing'
  const missingNames = await (await publicGet('')).json()
  assert.equal(missingNames.products.length, 1)
  assert.equal(missingNames.products[0].seller_name, null)
  assert.equal(missingNames.sellerNamesAvailable, false)
  sellerNameMode = 'error'
  assert.equal((await publicGet('')).status, 503)
  sellerNameMode = 'normal'
  publicProductMode = 'error'
  const publicError = await publicGet('')
  assert.equal(publicError.status, 503)
  assert.ok(!(await publicError.text()).includes('Private'))
  publicProductMode = 'normal'
  assert.equal(
    JSON.stringify([...productRows.values()]),
    publicRowsBefore,
    'Public reads must not mutate products',
  )
  console.log(
    'PASS: anonymous marketplace, published/in-stock-only queries, no owner-token escalation, safe seller-name projection, combined filters, literal wildcards, invalid inputs, empty results, missing projection fallback and safe service errors. SQL/RLS execution remains untested.',
  )
  profileRows.clear()
  profileRequests.length = 0
  console.log(
    'PASS: mocked product creation/list/update, JWT-derived ownership, profile requirement, exact decimal-string writes, validation, draft/publish/zero-stock rules, null image paths and actionable permission errors. No live products or SQL were written.',
  )
  authMode = 'valid'
  const profileRequest = (method = 'GET', body, token = testToken, query = '') =>
    fetch(`${base}/api/profile${query}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  for (const method of ['GET', 'PUT']) {
    assert.equal((await fetch(`${base}/api/profile`, { method })).status, 401)
    assert.equal(
      (await profileRequest(method, method === 'PUT' ? {} : undefined, 'invalid-token')).status,
      401,
    )
  }
  assert.equal(profileRequests.length, 0)
  const missingProfile = await profileRequest()
  assert.equal(missingProfile.status, 200)
  assert.equal(missingProfile.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await missingProfile.json(), {
    profile: {
      fullName: 'Registered Farmer',
      email: 'farmer@example.com',
      mobile: '',
      city: '',
      district: '',
      state: '',
      pinCode: '',
    },
    needsCompletion: true,
  })
  const ownProfile = {
    fullName: '  Verified   Farmer ',
    mobile: '',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pinCode: '411001',
  }
  const beforeInvalid = profileRequests.length
  for (const body of [
    null,
    [],
    {},
    { ...ownProfile, id: 'another-user' },
    { ...ownProfile, userId: 'another-user' },
    { ...ownProfile, email: 'changed@example.com' },
    { ...ownProfile, sellerId: 'other' },
    { ...ownProfile, fullName: 42 },
    { ...ownProfile, fullName: 'A' },
    { ...ownProfile, fullName: '1234' },
    { ...ownProfile, city: 'X'.repeat(101) },
    { ...ownProfile, mobile: '1234567890' },
    { ...ownProfile, pinCode: '012345' },
    { ...ownProfile, state: 'Maha\u0000rashtra' },
  ]) {
    assert.equal((await profileRequest('PUT', body)).status, 400)
  }
  assert.equal(profileRequests.length, beforeInvalid, 'Invalid writes must not reach the database')
  const firstSave = await profileRequest('PUT', ownProfile)
  assert.equal(firstSave.status, 200)
  assert.equal(profileRows.size, 1)
  assert.equal(profileRows.get('verified-user').mobile, null)
  const savedProfile = await firstSave.json()
  assert.equal(savedProfile.needsCompletion, false)
  assert.equal(savedProfile.profile.fullName, 'Verified Farmer')
  assert.equal(savedProfile.profile.email, 'farmer@example.com')
  assert.deepEqual(
    await (await profileRequest('GET', undefined, testToken, '?id=login-user')).json(),
    savedProfile,
  )
  const otherProfile = await profileRequest('GET', undefined, loginAccessToken)
  assert.equal((await otherProfile.json()).needsCompletion, true)
  assert.equal(
    (await profileRequest('PUT', { ...ownProfile, fullName: 'Second Farmer' }, loginAccessToken))
      .status,
    200,
  )
  assert.equal(profileRows.size, 2)
  assert.equal(profileRows.get('verified-user').full_name, 'Verified Farmer')
  const editedProfile = await profileRequest('PUT', {
    ...ownProfile,
    fullName: 'Updated Farmer',
    mobile: '9876543210',
  })
  assert.equal(editedProfile.status, 200)
  assert.equal((await editedProfile.json()).profile.mobile, '9876543210')
  assert.equal(profileRows.size, 2)
  profileRows.delete('verified-user')
  profileMode = 'race'
  assert.equal((await profileRequest('PUT', ownProfile)).status, 200)
  assert.equal(profileRows.get('verified-user').full_name, 'Verified Farmer')
  profileMode = 'normal'
  const nullable = Object.fromEntries(Object.keys(ownProfile).map(field => [field, null]))
  const incomplete = await profileRequest('PUT', nullable)
  assert.equal(incomplete.status, 200)
  assert.equal((await incomplete.json()).needsCompletion, true)
  for (profileMode of ['error', 'network-error', 'expired']) {
    for (const method of ['GET', 'PUT']) {
      const response = await profileRequest(method, method === 'PUT' ? ownProfile : undefined)
      assert.equal(response.status, profileMode === 'expired' ? 401 : 503)
      const text = await response.text()
      assert.ok(!text.includes('Private'))
      assert.ok(!text.includes(testToken))
    }
  }
  profileMode = 'normal'
  assert.ok(!output.includes('Registered Farmer'))
  assert.ok(!output.includes('9876543210'))
  console.log(
    'PASS: mocked private profile reads/writes, JWT-derived ownership, forwarded user token, missing-profile metadata, validation, nullable fields, insert/update grants, duplicate-race retry and safe database failures. Real RLS was not executed.',
  )
  authMode = 'valid'
  const resetRequest = input =>
    fetch(`${base}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
      body: JSON.stringify(input),
    })
  assert.equal((await fetch(`${base}/api/auth/reset-password`, { method: 'POST' })).status, 401)
  for (const password of ['', '   ', 'short', 'a'.repeat(12), '1'.repeat(12), 'a'.repeat(129)]) {
    assert.equal((await resetRequest({ password, refreshToken: 'fixture-refresh' })).status, 400)
  }
  assert.equal((await resetRequest({ password: 'NewPassword123!' })).status, 400)
  assert.equal(updateCount, 0)
  authMode = 401
  assert.equal(
    (await resetRequest({ password: 'NewPassword123!', refreshToken: 'fixture-refresh' })).status,
    401,
  )
  assert.equal(updateCount, 0)
  authMode = 'valid'
  for (updateMode of ['success', 400, 429, 503, 'network-error']) {
    const response = await resetRequest({
      password: 'NewPassword123!',
      refreshToken: 'fixture-refresh',
    })
    assert.equal(
      response.status,
      updateMode === 'success' ? 200 : updateMode === 400 ? 400 : updateMode === 429 ? 429 : 503,
    )
    const body = await response.text()
    assert.ok(!body.includes(testToken))
    assert.ok(!body.includes('NewPassword123!'))
    if (updateMode === 'success') assert.match(body, /Password updated/)
  }
  assert.ok(!output.includes(testToken))
  assert.ok(!output.includes('NewPassword123!'))
  console.log(
    'PASS: mocked password reset authorization, validation, update success/failure, rate limits and safe network errors.',
  )
  assert.equal(missingRoute.status, 404)
  assert.deepEqual(await missingRoute.json(), { message: 'Route not found' })
  const cors = await fetch(`${base}/api/health`, {
    headers: { Origin: environment.FRONTEND_ORIGIN },
  })
  assert.equal(cors.headers.get('access-control-allow-origin'), environment.FRONTEND_ORIGIN)
  for (const origin of [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://unrelated.example',
    'http://localhost:5174',
  ]) {
    const allowed = ['http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin)
    const preflight = await fetch(`${base}/api/auth/register`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.headers.get('access-control-allow-origin'), allowed ? origin : null)
    assert.match(preflight.headers.get('vary'), /Origin/i)
    if (allowed) {
      assert.ok(preflight.headers.get('access-control-allow-methods').split(',').includes('POST'))
      assert.match(preflight.headers.get('access-control-allow-headers'), /content-type/i)
      assert.match(preflight.headers.get('access-control-allow-headers'), /authorization/i)
    }
    // An invalid body checks POST CORS headers without creating an account.
    const invalidRegistration = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: '{}',
    })
    assert.equal(invalidRegistration.status, 400)
    assert.equal(
      invalidRegistration.headers.get('access-control-allow-origin'),
      allowed ? origin : null,
    )
    assert.deepEqual(await invalidRegistration.json(), {
      message: 'Enter a full name of 2–100 characters',
    })
  }
  console.log(
    'PASS: exact localhost/127.0.0.1 origin allowlist, registration preflight, POST headers, Authorization header and unrelated-origin rejection. No account created.',
  )
  const malformed = await fetch(`${base}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid',
  })
  assert.equal(malformed.status, 400)
  console.log(
    'PASS: startup/config errors, privileged-key rejection, health, empty/populated database reads, safe upstream/network failures, 404, CORS and JSON parsing.',
  )
  console.log(
    'Only local simulated requests were used. No live Supabase accounts or records were created.',
  )
  console.log(
    'PASS: missing/malformed Bearer headers, simulated invalid/expired tokens, verified-user projection, request isolation, safe Auth service/network errors and no token leakage.',
  )
  console.log(
    'PASS: registration validation, metadata, confirmation/no-confirmation, duplicate privacy, upstream errors, session isolation and credential redaction.',
  )
  console.log(
    'PASS: login input validation, session response, generic invalid/unconfirmed credentials, rate limits, service/network failures, malformed sessions, Bearer compatibility and no session/token leakage.',
  )
} finally {
  if (backend.exitCode === null) {
    backend.kill()
    await once(backend, 'exit')
  }
  await new Promise(resolve => database.close(resolve))
}
