import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import PasswordInput from '../components/auth/PasswordInput'
import { registerFarmer } from '../services/auth'
import type { AuthErrors, RegisterForm } from '../types/auth'
import { focusAuthError, validateRegister } from '../utils/authValidation'

export default function Register() {
  const [values, setValues] = useState<RegisterForm>({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    termsAcknowledged: false,
  })
  const [errors, setErrors] = useState<AuthErrors<RegisterForm>>({})
  const [notice, setNotice] = useState('')
  const [requestError, setRequestError] = useState('')
  const [loading, setLoading] = useState(false)
  const pending = useRef<AbortController | null>(null)

  useEffect(() => () => pending.current?.abort(), [])
  const termsId = useId()

  function change<K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) {
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
    const next = validateRegister(values)
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
      const message = await registerFarmer(values, controller.signal)
      if (!controller.signal.aborted) setNotice(message)
    } catch (error) {
      if (!controller.signal.aborted) {
        setRequestError(
          error instanceof Error ? error.message : 'Registration could not be completed.',
        )
      }
    } finally {
      if (!controller.signal.aborted) {
        setValues(previous => ({ ...previous, password: '', confirmPassword: '' }))
        setLoading(false)
      }
      pending.current = null
    }
  }

  return (
    <AuthLayout
      title="Grow with FarmMarket"
      description="One farmer account for buying and selling. No permanent Buyer or Seller choice is needed."
      notice="Registration sends your full name, email and password to Express and Supabase Auth. Mobile is checked here but is not sent or saved yet. Password confirmation and the acknowledgement are checked locally. Marketplace and profile pages still show demonstration data."
    >
      <form noValidate onSubmit={submit} aria-busy={loading}>
        <fieldset disabled={loading} className="space-y-5">
          <AuthInput
            name="fullName"
            label="Full Name"
            autoComplete="name"
            maxLength={100}
            value={values.fullName}
            error={errors.fullName}
            onChange={value => change('fullName', value)}
          />
          <AuthInput
            name="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={values.email}
            error={errors.email}
            onChange={value => change('email', value)}
          />
          <AuthInput
            name="mobile"
            label="Mobile Number"
            type="tel"
            autoComplete="tel-national"
            maxLength={10}
            value={values.mobile}
            error={errors.mobile}
            onChange={value => change('mobile', value)}
          />
          <PasswordInput
            name="password"
            label="Password"
            autoComplete="new-password"
            value={values.password}
            error={errors.password}
            onChange={value => change('password', value)}
            hint="Use 12-128 characters, including a letter and a number. Your password is sent to Supabase Auth through the backend; it is not saved in browser storage."
          />
          <PasswordInput
            name="confirmPassword"
            label="Confirm Password"
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={value => change('confirmPassword', value)}
          />
          <div>
            <label className="flex items-start gap-3 text-sm leading-6 text-stone-600">
              <input
                name="termsAcknowledged"
                type="checkbox"
                checked={values.termsAcknowledged}
                onChange={event => change('termsAcknowledged', event.target.checked)}
                aria-invalid={!!errors.termsAcknowledged}
                aria-describedby={errors.termsAcknowledged ? termsId : undefined}
                required
                className="mt-1 size-4 shrink-0 accent-emerald-700"
              />
              I understand registration is real and marketplace records are still demonstrations.
              This acknowledgement is not saved as legal acceptance.
            </label>
            {errors.termsAcknowledged && (
              <p id={termsId} className="mt-2 text-sm text-red-700">
                {errors.termsAcknowledged}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          {requestError && (
            <p role="alert" className="text-sm text-red-700">
              {requestError}
            </p>
          )}
          <p role="status" className="text-sm leading-6 text-emerald-900">
            {notice}
          </p>
          <p className="text-sm text-stone-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-800 underline underline-offset-4"
            >
              Login
            </Link>
          </p>
        </fieldset>
      </form>
    </AuthLayout>
  )
}
