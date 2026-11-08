import { mockProducts } from '../data/mockProducts'
import type { CartAction, CartSelection, CartState } from '../types/cart'

export function stockLimit(productId: string): number {
  const stock = mockProducts.find(product => product.id === productId)?.availableQuantity ?? 0
  return Number.isSafeInteger(stock) && stock > 0 ? stock : 0
}

// Saved product fields are ignored; only current IDs and positive whole quantities survive.
export function validateSelections(value: unknown): CartSelection[] {
  if (!Array.isArray(value)) return []
  const quantities = new Map<string, number>()
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const { productId, quantity } = entry
    if (typeof productId !== 'string' || !Number.isSafeInteger(quantity) || quantity < 1) continue
    const maximum = stockLimit(productId)
    if (!maximum) continue
    const previous = quantities.get(productId) ?? 0
    quantities.set(productId, previous + Math.min(quantity, maximum - previous))
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }))
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  const items = validateSelections(state.items)
  if (action.type === 'clear') return { items: [], message: 'Cart cleared.' }
  if (action.type === 'remove') {
    return {
      items: items.filter(item => item.productId !== action.productId),
      message: 'Item removed from cart.',
    }
  }
  const product = mockProducts.find(item => item.id === action.productId)
  const maximum = stockLimit(action.productId)
  if (!product || !maximum)
    return { items, message: 'This demonstration product is unavailable and cannot be added.' }
  if (!Number.isSafeInteger(action.quantity) || action.quantity < 1) {
    return { items, message: 'Choose a positive whole quantity within the available stock.' }
  }
  const existing = items.find(item => item.productId === action.productId)
  if (action.type === 'update' && !existing)
    return { items, message: 'This product is no longer in your cart.' }
  const previous = existing?.quantity ?? 0
  const requested = action.type === 'add' ? action.quantity : 0
  // Avoid overflow when an extremely large quantity is requested.
  const quantity =
    action.type === 'add'
      ? previous + Math.min(requested, maximum - previous)
      : Math.min(action.quantity, maximum)
  const limited = action.type === 'add' ? requested > maximum - previous : action.quantity > maximum
  const next = existing
    ? items.map(item => (item.productId === action.productId ? { ...item, quantity } : item))
    : [...items, { productId: action.productId, quantity }]
  const message = limited
    ? `Stock limit reached for ${product.name}. Your cart contains ${quantity} ${product.unit}; no more can be added.`
    : `${product.name}: cart quantity ${quantity} ${product.unit}. ${action.type === 'add' ? 'Added to cart.' : 'Quantity updated.'}`
  return { items: next, message }
}
