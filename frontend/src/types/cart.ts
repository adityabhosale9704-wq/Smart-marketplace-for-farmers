import type { Product } from './product'

export interface CartSelection {
  productId: Product['id']
  quantity: number
}

export interface CartLine extends CartSelection {
  product: Product
}

export interface CartState {
  items: CartSelection[]
  message: string
}

export type CartAction =
  | { type: 'add'; productId: Product['id']; quantity: number }
  | { type: 'update'; productId: Product['id']; quantity: number }
  | { type: 'remove'; productId: Product['id'] }
  | { type: 'clear' }

export interface CartContextValue {
  cartItems: CartLine[]
  totalItemCount: number
  estimatedSubtotal: number
  message: string
  storageWarning: boolean
  addItem: (productId: Product['id'], quantity: number) => void
  removeItem: (productId: Product['id']) => void
  updateQuantity: (productId: Product['id'], quantity: number) => void
  clearCart: () => void
}
