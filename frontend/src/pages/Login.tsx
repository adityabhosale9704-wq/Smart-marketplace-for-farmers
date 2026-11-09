import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import PasswordInput from '../components/auth/PasswordInput'
import { loginFarmer } from '../services/auth'
import type { AuthErrors, AuthSession, LoginForm } from '../types/auth'
import { focusAuthError, validateLogin } from '../utils/authValidation'

export default function Login({
  session,
  onSessionChange,
}: {
  session: AuthSession | null
  onSessionChange: (session: AuthSession | null) => void
}) {
  const [values, setValues] = useState<LoginForm>({ email: '', password: '', rememberEmail: false })
  const [errors, setErrors] = useState<AuthErrors<LoginForm>>({})
  const [notice, setNotice] = useState('')
  const [requestError, setRequestError] = useState('')
  const [loading, setLoading] = useState(false)
  const pending = useRef<AbortController | null>(null)

  useEffect(() => () => pending.current?.abort(), [])

  function change<K extends keyof LoginForm>(field: K, value: LoginForm[K]) {
    setValues(previous => ({ ...previous, [field]: value }))
    setErrors(previous => {
      const next = { ...previous }
      delete next[field]
      return next
    })
    setNotice('')
    setRequestError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const next = validateLogin(values)
    setErrors(next)
    setNotice('')
    setRequestError('')
    if (Object.keys(next).length) {
      focusAuthError(event.currentTarget, next)
      return
    }

    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    onSessionChange(null)
    try {
      const verifiedSession = await loginFarmer(values, controller.signal)
      if (!controller.signal.aborted) {
        onSessionChange(verifiedSession)
        setNotice('Login successful. Your identity was verified by the backend.')
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        onSessionChange(null)
        setRequestError(error instanceof Error ? error.message : 'Login could not be completed.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setValues(previous => ({ ...previous, password: '' }))
        setLoading(false)
      }
      pending.current = null
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Explore the future of buying and selling with FarmMarket."
      notice="Login uses the Express backend and Supabase Auth. Your verified identity and access token stay only in React memory until refresh. Marketplace, seller, order and profile records remain demonstration data."
    >
      <form noValidate onSubmit={submit} aria-busy={loading}>
        <fieldset disabled={loading} className="space-y-5">
          <AuthInput
            name="email"
            label="Email Address"
            type="email"
            autoComplete="username"
            maxLength={254}
            value={values.email}
            error={errors.email}
            onChange={value => change('email', value)}
          />
          <PasswordInput
            name="password"
            label="Password"
            autoComplete="current-password"
            value={values.password}
            error={errors.password}
            onChange={value => change('password', value)}
            hint="Use your account password. This form currently requires 12-128 characters."
          />
          <label className="flex items-start gap-3 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={values.rememberEmail}
              onChange={event => change('rememberEmail', event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-emerald-700"
            />
            Remember email (UI only; nothing is saved)
          </label>
          <Link
            to="/forgot-password"
            className="inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4"
          >
            Forgot Password?
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
          {requestError && (
            <p role="alert" className="text-sm text-red-700">
              {requestError}
            </p>
          )}
          <p role="status" className="text-sm leading-6 text-emerald-900">
            {notice}
          </p>
          {session && (
            <p className="text-sm text-emerald-900">
              Signed in as {session.user.email ?? 'a verified farmer'}. This session clears on
              refresh; token renewal is not implemented yet. The profile and seller previews are
              still demos.
            </p>
          )}
          <p className="text-sm text-stone-600">
            New to FarmMarket?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-800 underline underline-offset-4"
            >
              Create Account
            </Link>
          </p>
        </fieldset>
      </form>
    </AuthLayout>
  )
}
