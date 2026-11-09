import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import type { AuthErrors, ForgotPasswordForm } from '../types/auth'
import { focusAuthError, validateForgotPassword } from '../utils/authValidation'
import { requestPasswordReset } from '../services/auth'

export default function ForgotPassword() {
  const [values, setValues] = useState<ForgotPasswordForm>({ email: '' })
  const [errors, setErrors] = useState<AuthErrors<ForgotPasswordForm>>({})
  const [notice, setNotice] = useState('')
  const [requestError, setRequestError] = useState('')
  const [loading, setLoading] = useState(false)
  const pending = useRef<AbortController | null>(null)

  useEffect(() => () => pending.current?.abort(), [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const next = validateForgotPassword(values)
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
    try {
      const message = await requestPasswordReset(values, controller.signal)
      if (!controller.signal.aborted) setNotice(message)
    } catch (error) {
      if (!controller.signal.aborted) {
        setRequestError(error instanceof Error ? error.message : 'Password recovery unavailable.')
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
      pending.current = null
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Request an email to help recover your account."
      notice="Recovery requests use Supabase Auth through our backend. Open the recovery email link to choose a new password."
    >
      <form noValidate onSubmit={submit} aria-busy={loading} className="space-y-5">
        <fieldset disabled={loading} className="space-y-5">
          <AuthInput
            name="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={values.email}
            error={errors.email}
            onChange={email => {
              setValues({ email })
              setErrors({})
              setNotice('')
              setRequestError('')
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full disabled:opacity-60"
          >
            {loading ? 'Sending request...' : 'Request Reset'}
          </button>
        </fieldset>
        {requestError && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {requestError}
          </p>
        )}
        <p role="status" className="text-sm leading-6 text-emerald-900">
          {notice}
        </p>
        <Link
          to="/login"
          className="inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4"
        >
          Back to Login
        </Link>
      </form>
    </AuthLayout>
  )
}
