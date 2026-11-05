export type CategoryId = 'vegetables' | 'fruits' | 'grains' | 'pulses' | 'seeds' | 'spices'

export interface Product {
  id: string
  name: string
  category: CategoryId
  price: number
  unit: 'kg' | 'quintal'
  availableQuantity: number
  seller: string
  location: string
  image: string
}
