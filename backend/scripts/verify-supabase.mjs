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
const testToken = 'opaque-test-token-not-a-real-jwt'
const testPassword = 'Test123!'
const signupSessionToken = 'local-session-token-not-a-jwt'
let signupMode = 'confirmation'
let signupCount = 0
let loginMode = 'valid'
let loginCount = 0
const loginAccessToken = 'login-test-access-token-not-a-real-jwt'
const loginRefreshToken = 'login-test-refresh-token-placeholder'
const database = createServer((request, response) => {
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
        user_metadata: { private: 'must not be returned' },
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
  const missingRoute = await fetch(`${base}/api/missing`)
  assert.equal(missingRoute.status, 404)
  assert.deepEqual(await missingRoute.json(), { message: 'Route not found' })
  const cors = await fetch(`${base}/api/health`, {
    headers: { Origin: environment.FRONTEND_ORIGIN },
  })
  assert.equal(cors.headers.get('access-control-allow-origin'), environment.FRONTEND_ORIGIN)
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
