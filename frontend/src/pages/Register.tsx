import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import PasswordInput from '../components/auth/PasswordInput'
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
  const termsId = useId()

  function change<K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) {
    setValues(previous => ({ ...previous, [field]: value }))
    setErrors(previous => {
      const next = { ...previous }
      delete next[field]
      return next
    })
    setNotice('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validateRegister(values)
    setErrors(next)
    if (Object.keys(next).length) {
      setNotice('')
      focusAuthError(event.currentTarget, next)
      return
    }
    setNotice(
      'The form passes local checks. Registration is not connected yet. No account has been created and no acknowledgement has been recorded.',
    )
  }

  return (
    <AuthLayout
      title="Grow with FarmMarket"
      description="One future farmer account for buying and selling. No permanent Buyer or Seller choice is needed."
    >
      <form noValidate onSubmit={submit} className="space-y-5">
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
          hint="Use 12-128 characters, including a letter and a number. These frontend checks alone do not make a password secure."
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
            I acknowledge this is a demonstration. Real terms will be provided before launch; no
            legal acceptance is recorded.
          </label>
          {errors.termsAcknowledged && (
            <p id={termsId} className="mt-2 text-sm text-red-700">
              {errors.termsAcknowledged}
            </p>
          )}
        </div>
        <button type="submit" className="button-primary w-full">
          Create Account
        </button>
        <p role="status" className="text-sm leading-6 text-emerald-900">
          {notice}
        </p>
        <p className="text-sm text-stone-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-800 underline underline-offset-4">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
