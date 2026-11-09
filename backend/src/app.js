import express from 'express'
import cors from 'cors'
import supabase, { createSupabaseClient } from './config/supabase.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://127.0.0.1:5173'

app.disable('x-powered-by')
app.use(cors({ origin: frontendOrigin }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', message: 'FarmMarket API is running' })
})

app.get('/api/db-health', async (request, response) => {
  const { error } = await supabase
    .from('products')
    .select('id')
    .limit(1)
    .abortSignal(AbortSignal.timeout(5000))

  if (error) {
    return response
      .status(503)
      .json({ status: 'error', message: 'Database connection unavailable' })
  }

  response.json({ status: 'ok', message: 'Database connection is working' })
})

app.get('/api/auth/me', requireAuth, (request, response) => {
  response.json(request.user)
})

app.post('/api/auth/register', async (request, response) => {
  const fullName =
    typeof request.body?.fullName === 'string'
      ? request.body.fullName.trim().replace(/\s+/g, ' ')
      : ''
  const email =
    typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = request.body?.password

  if (fullName.length < 2 || fullName.length > 100) {
    return response.status(400).json({ message: 'Enter a full name of 2–100 characters' })
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) {
    return response.status(400).json({ message: 'Enter a valid email address' })
  }
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 128 ||
    !password.trim()
  ) {
    return response.status(400).json({ message: 'Use a password of 8–128 characters' })
  }

  try {
    const client = createSupabaseClient()
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { fullName } },
    })

    // Existing accounts get the same response to avoid revealing who has registered.
    const existingAccount = error && ['user_already_exists', 'email_exists'].includes(error.code)
    if (error && !existingAccount) {
      if (error.status === 429) {
        return response
          .status(429)
          .json({ message: 'Too many registration attempts. Try again later.' })
      }
      const invalidDetails = [400, 422].includes(error.status)
      return response.status(invalidDetails ? 400 : 503).json({
        message: invalidDetails
          ? 'Registration could not be completed. Check your details and password requirements.'
          : 'Registration service unavailable. Try again later.',
      })
    }
    if (!existingAccount && !data.user?.id) {
      return response
        .status(503)
        .json({ message: 'Registration service unavailable. Try again later.' })
    }
  } catch {
    return response
      .status(503)
      .json({ message: 'Registration service unavailable. Try again later.' })
  }

  response.json({
    message:
      'Registration request received. If email confirmation is required, check your email. You are not signed in.',
  })
})

app.post('/api/auth/login', async (request, response) => {
  response.set('Cache-Control', 'no-store')
  const email =
    typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = request.body?.password

  if (email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) {
    return response.status(400).json({ message: 'Enter a valid email address' })
  }
  if (typeof password !== 'string' || !password.trim() || password.length > 128) {
    return response.status(400).json({ message: 'Enter your password (at most 128 characters)' })
  }

  try {
    const client = createSupabaseClient()
    const { data, error } = await client.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.status === 429) {
        return response.status(429).json({ message: 'Too many login attempts. Try again later.' })
      }
      const rejected = [400, 401, 403, 422].includes(error.status)
      return response.status(rejected ? 401 : 503).json({
        message: rejected
          ? 'Unable to sign in. Check your email and password, and confirm your email if required.'
          : 'Login service unavailable. Try again later.',
      })
    }

    const { user, session } = data
    if (
      !user?.id ||
      !session?.access_token ||
      !session.refresh_token ||
      !Number.isFinite(session.expires_in) ||
      session.expires_in <= 0
    ) {
      return response.status(503).json({ message: 'Login service unavailable. Try again later.' })
    }

    response.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email ?? null },
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    })
  } catch {
    response.status(503).json({ message: 'Login service unavailable. Try again later.' })
  }
})

app.post('/api/auth/forgot-password', async (request, response) => {
  response.set('Cache-Control', 'no-store')
  const email =
    typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''

  if (email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) {
    return response.status(400).json({ message: 'Enter a valid email address' })
  }

  try {
    const client = createSupabaseClient()
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: new URL('/reset-password', frontendOrigin).href,
    })

    // Unknown accounts receive the same message as existing accounts.
    if (error && error.code !== 'user_not_found') {
      if (error.status === 429) {
        return response
          .status(429)
          .json({ message: 'Too many recovery requests. Try again later.' })
      }
      return response
        .status(503)
        .json({ message: 'Password recovery unavailable. Try again later.' })
    }
  } catch {
    return response.status(503).json({ message: 'Password recovery unavailable. Try again later.' })
  }

  response.json({
    message: 'If an account exists for this email, a password reset email will be sent.',
  })
})

app.post('/api/auth/reset-password', requireAuth, async (request, response) => {
  response.set('Cache-Control', 'no-store')
  const { password, refreshToken } = request.body ?? {}
  if (
    typeof password !== 'string' ||
    !password.trim() ||
    password.length < 12 ||
    password.length > 128 ||
    !/\p{L}/u.test(password) ||
    !/\p{N}/u.test(password)
  ) {
    return response
      .status(400)
      .json({ message: 'Use 12–128 characters with at least one letter and one number.' })
  }
  if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
    return response.status(400).json({ message: 'A valid recovery session is required.' })
  }
  try {
    const client = createSupabaseClient()
    const accessToken = request.get('Authorization').split(' ')[1]
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error || data.user?.id !== request.user.id) {
      const status = error && ![400, 401, 403, 422].includes(error.status) ? 503 : 401
      return response
        .status(status)
        .json({ message: 'Recovery session could not be verified. Request a new recovery email.' })
    }
    const result = await client.auth.updateUser({ password })
    if (result.error) {
      const status =
        result.error.status === 429
          ? 429
          : [400, 401, 403, 422].includes(result.error.status)
            ? 400
            : 503
      return response.status(status).json({
        message:
          'Password could not be updated. Check the password requirements or request a new recovery email.',
      })
    }
    if (result.data.user?.id !== request.user.id) {
      return response.status(503).json({ message: 'Password update could not be confirmed.' })
    }
    response.json({ message: 'Password updated. Please log in with your new password.' })
  } catch {
    response.status(503).json({ message: 'Password recovery unavailable. Try again later.' })
  }
})

app.use((request, response) => {
  response.status(404).json({ message: 'Route not found' })
})

// Keep parser errors and unexpected failures in JSON without exposing internals.
app.use((error, request, response, next) => {
  if (response.headersSent) return next(error)
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ message: 'Invalid JSON request body' })
  }
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ message: 'Request body is too large' })
  }
  response.status(500).json({ message: 'Internal server error' })
})

export default app
