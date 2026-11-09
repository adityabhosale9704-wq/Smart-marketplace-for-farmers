import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import PasswordInput from '../components/auth/PasswordInput'
import { resetPassword, verifyRecoveryLink } from '../services/auth'
import type { AuthErrors, RecoverySession, ResetPasswordForm } from '../types/auth'
import { focusAuthError, validateResetPassword } from '../utils/authValidation'

export default function ResetPassword() {
  const [values, setValues] = useState<ResetPasswordForm>({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<AuthErrors<ResetPasswordForm>>({})
  const [session, setSession] = useState<RecoverySession | null>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const verification = useRef<Promise<RecoverySession> | null>(null)
  const submitting = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    if (!verification.current) {
      const link = window.location.href
      // Clear credentials before rendering links or making network requests.
      window.history.replaceState(window.history.state, '', window.location.pathname)
      verification.current = verifyRecoveryLink(link)
    }
    verification.current
      .then(verified => {
        if (!controller.signal.aborted) {
          setSession(verified)
          setChecking(false)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailure(
            'This recovery link could not be verified. It may be invalid or expired. Request a new email, or check your connection and reopen the link.',
          )
          setChecking(false)
        }
      })
    return () => {
      controller.abort()
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || submitting.current) return
    const next = validateResetPassword(values)
    setErrors(next)
    setFailure('')
    if (Object.keys(next).length) {
      focusAuthError(event.currentTarget, next)
      return
    }
    submitting.current = true
    setLoading(true)
    try {
      await resetPassword(session, values.password)
      setMessage('Password updated. Please log in with your new password.')
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Password could not be updated.')
    } finally {
      setSession(null)
      verification.current = null
      setValues({ password: '', confirmPassword: '' })
      setLoading(false)
      submitting.current = false
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Choose a new password for your farmer account."
      notice="Your recovery session is temporary and separate from the marketplace login. After updating your password, log in again."
    >
      {checking && <p role="status">Checking recovery link...</p>}
      <form noValidate onSubmit={submit} aria-busy={checking || loading} className="space-y-5">
        <fieldset disabled={!session || loading} className="space-y-5">
          <PasswordInput
            name="password"
            label="New password"
            autoComplete="new-password"
            value={values.password}
            hint="Use 12–128 characters, including a letter and a number."
            error={errors.password}
            onChange={password => {
              setValues(previous => ({ ...previous, password }))
              setErrors({})
            }}
          />
          <PasswordInput
            name="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={confirmPassword => {
              setValues(previous => ({ ...previous, confirmPassword }))
              setErrors({})
            }}
          />
          <button
            type="submit"
            disabled={!session || loading}
            className="button-primary w-full disabled:opacity-60"
          >
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </fieldset>
        {failure && (
          <p role="alert" className="text-sm text-red-700">
            {failure}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-emerald-900">
            {message}
          </p>
        )}
        <Link
          to="/forgot-password"
          className="block text-sm font-semibold text-emerald-800 underline"
        >
          Request a new recovery email
        </Link>
        <Link to="/login" className="inline-block text-sm font-semibold text-emerald-800 underline">
          Back to Login
        </Link>
      </form>
    </AuthLayout>
  )
}
