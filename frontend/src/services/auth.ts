import type {
  AuthSession,
  AuthUser,
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
  RecoverySession,
} from '../types/auth'
import type { Session } from '@supabase/supabase-js'
import supabase from './supabase'

const configurationMessage =
  'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env, then restart Vite.'

class AuthRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5000').replace(/\/+$/, '')

async function authRequest(path: string, options: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(10000),
      cache: 'no-store',
    })
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
    throw new AuthRequestError(message, response.status)
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

async function verifySession(session: Session | null): Promise<AuthSession | null> {
  if (!session) return null
  const user = await authRequest('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!isAuthUser(user) || user.id !== session.user.id) {
    throw new AuthRequestError('Your identity could not be verified. Please sign in again.', 401)
  }
  return { user, accessToken: session.access_token }
}

// Read through the SDK so protected requests use its latest, refreshed access token.
export async function getAuthenticatedSession(): Promise<AuthSession | null> {
  if (!supabase) throw new Error(configurationMessage)
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error('Your saved session could not be restored. Please sign in again.')
  return verifySession(data.session)
}

export function watchAuthSession(
  onChange: (session: AuthSession | null, error: string, checking: boolean) => void,
): () => void {
  if (!supabase) {
    onChange(null, configurationMessage, false)
    return () => {}
  }
  let version = 0
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, savedSession) => {
    const current = ++version
    // Do not call more SDK methods while an auth event is being delivered.
    queueMicrotask(async () => {
      if (current !== version) return
      if (event === 'PASSWORD_RECOVERY') {
        onChange(null, '', false)
        return
      }
      // Hide the previous identity while the backend verifies a changed session.
      onChange(null, '', Boolean(savedSession))
      try {
        const verified = await getAuthenticatedSession()
        if (current === version) onChange(verified, '', false)
      } catch (error) {
        if (current !== version) return
        if (error instanceof AuthRequestError && error.status === 401) {
          const result = await supabase!.auth
            .signOut({ scope: 'local' })
            .catch(() => ({ error: true }))
          if (current !== version) return
          if (result.error) {
            onChange(
              null,
              'Session verification failed and the saved session could not be cleared. Reconnect and reload before signing in.',
              false,
            )
            return
          }
        }
        onChange(
          null,
          error instanceof Error ? error.message : 'Session verification unavailable.',
          false,
        )
      }
    })
  })
  return () => {
    version++
    subscription.unsubscribe()
  }
}

export async function logoutFarmer(): Promise<void> {
  if (!supabase) throw new Error(configurationMessage)
  const { error } = await supabase.auth.signOut({ scope: 'local' }).catch(() => ({ error: true }))
  if (error)
    throw new Error(
      'Could not sign out. Check your connection and retry. Your saved session may still be active.',
    )
}

export async function loginFarmer(
  values: Pick<LoginForm, 'email' | 'password'>,
  signal?: AbortSignal,
): Promise<AuthSession> {
  if (!supabase) throw new Error(configurationMessage)
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
    !data.accessToken ||
    !('refreshToken' in data) ||
    typeof data.refreshToken !== 'string' ||
    !data.refreshToken
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
  if (signal?.aborted) throw new Error('Login was cancelled.')
  const established = await supabase.auth.setSession({
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
  })
  if (established.error || !established.data.session) {
    throw new Error('Your browser session could not be saved. Please try signing in again.')
  }
  const saved = established.data.session
  if (saved.user.id !== user.id) {
    await supabase.auth.signOut({ scope: 'local' })
    throw new Error('Your identity could not be verified. Please sign in again.')
  }
  if (saved.access_token !== data.accessToken) {
    const verified = await verifySession(saved)
    if (!verified) throw new Error('Your session could not be verified.')
    return verified
  }
  return { user, accessToken: saved.access_token }
}
