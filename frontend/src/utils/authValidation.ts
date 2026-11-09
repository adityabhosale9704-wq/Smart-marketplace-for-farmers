import type {
  AuthErrors,
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
  ResetPasswordForm,
} from '../types/auth'

function emailError(value: string): string | undefined {
  const email = value.trim()
  if (!email) return 'Email address is required.'
  if (email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email))
    return 'Enter a valid email address (254 characters or fewer).'
}

function passwordError(password: string): string | undefined {
  if (!password.trim()) return 'Password is required.'
  if (password.length < 12 || password.length > 128) return 'Use between 12 and 128 characters.'
}

export function validateLogin(values: LoginForm): AuthErrors<LoginForm> {
  const errors: AuthErrors<LoginForm> = {}
  const email = emailError(values.email)
  const password = passwordError(values.password)
  if (email) errors.email = email
  if (password) errors.password = password
  return errors
}

export function validateRegister(values: RegisterForm): AuthErrors<RegisterForm> {
  const errors: AuthErrors<RegisterForm> = {}
  const name = values.fullName.trim().replace(/\s+/g, ' ')
  if (
    name.length > 100 ||
    (name.match(/\p{L}/gu)?.length ?? 0) < 2 ||
    !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)
  ) {
    errors.fullName =
      'Enter a name with 2 or more letters, without numbers, using at most 100 characters.'
  }
  const email = emailError(values.email)
  if (email) errors.email = email
  if (!/^[6-9]\d{9}$/.test(values.mobile.trim()))
    errors.mobile = 'Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
  const password = passwordError(values.password)
  if (password) errors.password = password
  else if (!/\p{L}/u.test(values.password) || !/\p{N}/u.test(values.password))
    errors.password = 'Include at least one letter and one number in your password.'
  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm your password.'
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = 'Passwords must match exactly.'
  if (!values.termsAcknowledged)
    errors.termsAcknowledged =
      'Check the acknowledgement to continue. No legal acceptance is recorded.'
  return errors
}

export function validateForgotPassword(values: ForgotPasswordForm): AuthErrors<ForgotPasswordForm> {
  const error = emailError(values.email)
  return error ? { email: error } : {}
}

export function validateResetPassword(values: ResetPasswordForm): AuthErrors<ResetPasswordForm> {
  const errors: AuthErrors<ResetPasswordForm> = {}
  const password = passwordError(values.password)
  if (password) errors.password = password
  else if (!/\p{L}/u.test(values.password) || !/\p{N}/u.test(values.password))
    errors.password = 'Include at least one letter and one number in your password.'
  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm your password.'
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = 'Passwords must match exactly.'
  return errors
}

// Focus the first invalid field without logging or persisting any entered values.
export function focusAuthError(form: HTMLFormElement, errors: object) {
  const name = Object.keys(errors)[0]
  if (name) form.querySelector<HTMLElement>(`[name="${name}"]`)?.focus()
}
