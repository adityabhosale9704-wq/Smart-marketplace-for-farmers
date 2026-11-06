import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import PasswordInput from '../components/auth/PasswordInput'
import type { AuthErrors, LoginForm } from '../types/auth'
import { focusAuthError, validateLogin } from '../utils/authValidation'

export default function Login() {
  const [values, setValues] = useState<LoginForm>({ email: '', password: '', rememberEmail: false })
  const [errors, setErrors] = useState<AuthErrors<LoginForm>>({})
  const [notice, setNotice] = useState('')

  function change<K extends keyof LoginForm>(field: K, value: LoginForm[K]) {
    setValues(previous => ({ ...previous, [field]: value }))
    setErrors(previous => { const next = { ...previous }; delete next[field]; return next })
    setNotice('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validateLogin(values)
    setErrors(next)
    if (Object.keys(next).length) { setNotice(''); focusAuthError(event.currentTarget, next); return }
    setNotice('The form passes local checks. Real login is not connected yet. No session has been created.')
  }

  return (
    <AuthLayout title="Welcome back" description="Explore the future of buying and selling with FarmMarket.">
      <form noValidate onSubmit={submit} className="space-y-5">
        <AuthInput name="email" label="Email Address" type="email" autoComplete="username" maxLength={254} value={values.email} error={errors.email} onChange={value => change('email', value)} />
        <PasswordInput name="password" label="Password" autoComplete="current-password" value={values.password} error={errors.password} onChange={value => change('password', value)} hint="Demo check: use 12-128 characters. No password is checked against an account." />
        <label className="flex items-start gap-3 text-sm text-stone-600"><input type="checkbox" checked={values.rememberEmail} onChange={event => change('rememberEmail', event.target.checked)} className="mt-1 size-4 shrink-0 accent-emerald-700" />Remember email (UI only; nothing is saved)</label>
        <Link to="/forgot-password" className="inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4">Forgot Password?</Link>
        <button type="submit" className="button-primary w-full">Login</button>
        <p role="status" className="text-sm leading-6 text-emerald-900">{notice}</p>
        <p className="text-sm text-stone-600">New to FarmMarket? <Link to="/register" className="font-semibold text-emerald-800 underline underline-offset-4">Create Account</Link></p>
      </form>
    </AuthLayout>
  )
}
