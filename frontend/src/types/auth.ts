export interface LoginForm {
  email: string
  password: string
  rememberEmail: boolean
}

export interface RegisterForm {
  fullName: string
  email: string
  mobile: string
  password: string
  confirmPassword: string
  termsAcknowledged: boolean
}

export interface ForgotPasswordForm {
  email: string
}

export type AuthErrors<T> = Partial<Record<keyof T, string>>

export interface AuthUser {
  id: string
  email: string | null
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
}
