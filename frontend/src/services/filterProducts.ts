import type { CategoryId, Product } from '../types/product'

export type SortOrder = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

export interface ProductFilters {
  search: string
  category: CategoryId | ''
  location: string
  minPrice: string
  maxPrice: string
}

export const emptyFilters: ProductFilters = {
  search: '', category: '', location: '', minPrice: '', maxPrice: '',
}

export function priceRangeError(min: string, max: string): string | null {
  const values = [min, max].filter(value => value.trim() !== '').map(Number)
  if (values.some(value => !Number.isFinite(value) || value < 0)) {
    return 'Enter valid prices of zero or more.'
  }
  if (min.trim() !== '' && max.trim() !== '' && Number(min) > Number(max)) {
    return 'Minimum price must be less than or equal to maximum price.'
  }
  return null
}

export function filterProducts(products: Product[], filters: ProductFilters, sort: SortOrder): Product[] {
  if (priceRangeError(filters.minPrice, filters.maxPrice)) return []
  const search = filters.search.trim().replace(/\s+/g, ' ').toLowerCase()
  const filtered = products.filter(product => {
    const text = `${product.name} ${product.category} ${product.seller}`.toLowerCase()
    return text.includes(search)
      && (!filters.category || product.category === filters.category)
      && (!filters.location || product.location === filters.location)
      && (filters.minPrice.trim() === '' || product.price >= Number(filters.minPrice))
      && (filters.maxPrice.trim() === '' || product.price <= Number(filters.maxPrice))
  })

  return [...filtered].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price || a.name.localeCompare(b.name)
    if (sort === 'price-desc') return b.price - a.price || a.name.localeCompare(b.name)
    return sort === 'name-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
  })
}
