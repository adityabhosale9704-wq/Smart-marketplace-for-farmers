import type {
  AuthSession,
  AuthUser,
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
  RecoverySession,
} from '../types/auth'

const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5000').replace(/\/+$/, '')

async function authRequest(path: string, options: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${apiUrl}${path}`, { ...options, cache: 'no-store' })
  } catch {
    throw new Error('Cannot reach the authentication server. Check your connection and try again.')
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('The authentication server returned an unreadable response. Try again later.')
  }
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Authentication request failed. Try again.'
    throw new Error(message)
  }
  return data
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    !!value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    'email' in value &&
    (typeof value.email === 'string' || value.email === null)
  )
}

export async function requestPasswordReset(
  values: ForgotPasswordForm,
  signal?: AbortSignal,
): Promise<string> {
  const data = await authRequest('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: values.email }),
    signal,
  })
  if (
    !data ||
    typeof data !== 'object' ||
    !('message' in data) ||
    typeof data.message !== 'string'
  ) {
    throw new Error('The password recovery response was incomplete. Try again later.')
  }
  return data.message
}

export async function verifyRecoveryLink(url: string): Promise<RecoverySession> {
  const link = new URL(url)
  const fragment = new URLSearchParams(link.hash.slice(1))
  const accessToken = fragment.get('access_token')
  const refreshToken = fragment.get('refresh_token')
  if (link.searchParams.has('code') || link.searchParams.has('token_hash')) {
    throw new Error(
      'This link uses a different recovery flow. Request a new email using the standard recovery email template.',
    )
  }
  if (
    fragment.get('type') !== 'recovery' ||
    !accessToken ||
    !refreshToken ||
    fragment.has('error')
  ) {
    throw new Error(
      'This recovery link is missing, invalid or expired. Request a new recovery email.',
    )
  }
  const user = await authRequest('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!isAuthUser(user))
    throw new Error('This recovery link could not be verified. Request a new email.')
  return { accessToken, refreshToken }
}

export async function resetPassword(session: RecoverySession, password: string): Promise<void> {
  await authRequest('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify({ password, refreshToken: session.refreshToken }),
  })
}

export async function registerFarmer(
  values: Pick<RegisterForm, 'fullName' | 'email' | 'password'>,
  signal?: AbortSignal,
): Promise<string> {
  const data = await authRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    }),
    signal,
  })
  if (
    !data ||
    typeof data !== 'object' ||
    !('message' in data) ||
    typeof data.message !== 'string'
  ) {
    throw new Error('The registration response was incomplete. Try again later.')
  }
  return data.message
}

export async function loginFarmer(
  values: Pick<LoginForm, 'email' | 'password'>,
  signal?: AbortSignal,
): Promise<AuthSession> {
  const data = await authRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: values.email, password: values.password }),
    signal,
  })
  if (
    !data ||
    typeof data !== 'object' ||
    !('user' in data) ||
    !isAuthUser(data.user) ||
    !('accessToken' in data) ||
    typeof data.accessToken !== 'string' ||
    !data.accessToken
  ) {
    throw new Error('The login response was incomplete. Please try again.')
  }

  const user = await authRequest('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${data.accessToken}` },
    signal,
  })
  if (!isAuthUser(user) || user.id !== data.user.id) {
    throw new Error('Your identity could not be verified. Please sign in again.')
  }
  return { user, accessToken: data.accessToken }
}
