import { createContext } from 'react'
import type { AuthSession } from '../types/auth'

export const AuthContext = createContext<{
  session: AuthSession | null
  checking: boolean
  signOut: () => Promise<void>
} | null>(null)
