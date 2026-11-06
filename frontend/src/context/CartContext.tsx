import { useEffect, useMemo, useReducer, useState } from 'react'
import type { ReactNode } from 'react'
import { CartContext } from './cartContextValue'
import { cartReducer } from '../utils/cart'
import { readCart, writeCart } from '../utils/cartStorage'
import { mockProducts } from '../data/mockProducts'
import type { CartContextValue, CartLine } from '../types/cart'

export default function CartProvider({ children }: { children: ReactNode }) {
  const [restored] = useState(readCart)
  const [state, dispatch] = useReducer(cartReducer, { items: restored.items, message: '' })
  const [storageWarning, setStorageWarning] = useState(restored.storageWarning)

  useEffect(() => {
    const saved = writeCart(state.items)
    // This effect synchronizes browser storage; report external write failures to the UI.
    // oxlint-disable-next-line react/set-state-in-effect
    setStorageWarning(!saved)
  }, [state.items])

  const cartItems = useMemo<CartLine[]>(() => state.items.flatMap(item => {
    const product = mockProducts.find(candidate => candidate.id === item.productId)
    return product ? [{ ...item, product }] : []
  }), [state.items])

  const value: CartContextValue = {
    cartItems,
    totalItemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    estimatedSubtotal: cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    message: state.message,
    storageWarning,
    addItem: (productId, quantity) => dispatch({ type: 'add', productId, quantity }),
    removeItem: productId => dispatch({ type: 'remove', productId }),
    updateQuantity: (productId, quantity) => dispatch({ type: 'update', productId, quantity }),
    clearCart: () => dispatch({ type: 'clear' }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
