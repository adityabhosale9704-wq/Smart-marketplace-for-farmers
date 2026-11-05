import type { CategoryId } from '../types/product'

export const categoryOptions: { id: CategoryId; name: string }[] = [
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'fruits', name: 'Fruits' },
  { id: 'grains', name: 'Grains' },
  { id: 'pulses', name: 'Pulses' },
  { id: 'seeds', name: 'Seeds' },
  { id: 'spices', name: 'Spices' },
]

export function parseCategory(value: string | null): CategoryId | '' {
  return categoryOptions.find(category => category.id === value?.toLowerCase())?.id ?? ''
}
