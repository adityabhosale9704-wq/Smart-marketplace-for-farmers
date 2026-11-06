import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import type { AuthErrors, ForgotPasswordForm } from '../types/auth'
import { focusAuthError, validateForgotPassword } from '../utils/authValidation'

export default function ForgotPassword() {
  const [values, setValues] = useState<ForgotPasswordForm>({ email: '' })
  const [errors, setErrors] = useState<AuthErrors<ForgotPasswordForm>>({})
  const [notice, setNotice] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validateForgotPassword(values)
    setErrors(next)
    if (Object.keys(next).length) { setNotice(''); focusAuthError(event.currentTarget, next); return }
    setNotice('The email format passes local checks. Password reset is not connected yet. No reset email has been sent.')
  }

  return (
    <AuthLayout title="Forgot your password?" description="Preview the password reset form. Email delivery will be available after authentication is integrated.">
      <form noValidate onSubmit={submit} className="space-y-5">
        <AuthInput name="email" label="Email Address" type="email" autoComplete="email" maxLength={254} value={values.email} error={errors.email} onChange={email => { setValues({ email }); setErrors({}); setNotice('') }} />
        <button type="submit" className="button-primary w-full">Request Reset</button>
        <p role="status" className="text-sm leading-6 text-emerald-900">{notice}</p>
        <Link to="/login" className="inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4">Back to Login</Link>
      </form>
    </AuthLayout>
  )
}
