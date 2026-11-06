import type { CartSelection } from '../types/cart'
import { validateSelections } from './cart'

export const CART_STORAGE_KEY = 'farmmarket.cart.v1'

export function readCart(): { items: CartSelection[]; storageWarning: boolean } {
  if (typeof window === 'undefined') return { items: [], storageWarning: false }
  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!saved) return { items: [], storageWarning: false }
    try {
      const value: unknown = JSON.parse(saved)
      return { items: validateSelections(value), storageWarning: false }
    } catch {
      return { items: [], storageWarning: false }
    }
  } catch {
    return { items: [], storageWarning: true }
  }
}

export function writeCart(items: CartSelection[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validateSelections(items)))
    return true
  } catch {
    return false
  }
}
