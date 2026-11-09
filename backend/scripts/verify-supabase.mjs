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
const database = createServer((request, response) => {
  assert.equal(request.method, 'GET')
  if (request.url === '/auth/v1/user') {
    authCount++
    assert.equal(request.headers.authorization, `Bearer ${testToken}`)
    if (authMode === 'network-error') return request.socket.destroy()
    response.setHeader('Content-Type', 'application/json')
    if (typeof authMode === 'number') {
      response.statusCode = authMode
      return response.end(JSON.stringify({ message: `Private details: ${testToken}` }))
    }
    return response.end(
      JSON.stringify({
        id: authMode === 'second-user' ? 'second-verified-user' : 'verified-user',
        email: 'farmer@example.com',
        user_metadata: { private: 'must not be returned' },
      }),
    )
  }
  assert.equal(request.url, '/rest/v1/products?select=id&limit=1')
  assert.notEqual(request.headers.authorization, `Bearer ${testToken}`)
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
    'Only local simulated GET requests were used. Live Supabase testing remains separate.',
  )
  console.log(
    'PASS: missing/malformed Bearer headers, simulated invalid/expired tokens, verified-user projection, request isolation, safe Auth service/network errors and no token leakage.',
  )
} finally {
  if (backend.exitCode === null) {
    backend.kill()
    await once(backend, 'exit')
  }
  await new Promise(resolve => database.close(resolve))
}
