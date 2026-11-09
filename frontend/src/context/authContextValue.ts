import { createContext } from 'react'
import type { AuthSession } from '../types/auth'

export const AuthContext = createContext<{
  session: AuthSession | null
  clearSession: () => void
} | null>(null)
