import { categoryOptions } from '../data/categories'
import type { ProductNavigationState } from '../types/productNavigation'
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
  search: '',
  category: '',
  location: '',
  minPrice: '',
  maxPrice: '',
}

export function priceRangeError(min: string, max: string): string | null {
  const values = [min, max].filter(value => value.trim() !== '').map(Number)
  if (
    [min, max].some(value => value.trim() && !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) ||
    values.some(value => !Number.isFinite(value) || value < 0 || value > 1000000)
  ) {
    return 'Use prices from zero to 1,000,000 with up to two decimal places.'
  }
  if (min.trim() !== '' && max.trim() !== '' && Number(min) > Number(max)) {
    return 'Minimum price must be less than or equal to maximum price.'
  }
  return null
}

export function filterProducts(
  products: Product[],
  filters: ProductFilters,
  sort: SortOrder,
): Product[] {
  if (priceRangeError(filters.minPrice, filters.maxPrice)) return []
  const search = filters.search.trim().replace(/\s+/g, ' ').toLowerCase()
  const filtered = products.filter(product => {
    const text = `${product.name} ${product.category} ${product.seller}`.toLowerCase()
    return (
      text.includes(search) &&
      (!filters.category || product.category === filters.category) &&
      (!filters.location || product.location === filters.location) &&
      (filters.minPrice.trim() === '' || product.price >= Number(filters.minPrice)) &&
      (filters.maxPrice.trim() === '' || product.price <= Number(filters.maxPrice))
    )
  })

  return [...filtered].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price || a.name.localeCompare(b.name)
    if (sort === 'price-desc') return b.price - a.price || a.name.localeCompare(b.name)
    return sort === 'name-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
  })
}

// Browser history can contain old or malformed state, so check it before using it.
export function readProductNavigationState(value: unknown): ProductNavigationState | null {
  if (!value || typeof value !== 'object') return null
  const state = value as Partial<ProductNavigationState>
  const filters = state.filters
  if (
    typeof state.returnTo !== 'string' ||
    !(state.returnTo === '/marketplace' || state.returnTo.startsWith('/marketplace?')) ||
    !filters ||
    typeof filters !== 'object' ||
    typeof filters.search !== 'string' ||
    typeof filters.location !== 'string' ||
    typeof filters.minPrice !== 'string' ||
    typeof filters.maxPrice !== 'string' ||
    !(
      filters.category === '' || categoryOptions.some(category => category.id === filters.category)
    ) ||
    !['name-asc', 'name-desc', 'price-asc', 'price-desc'].includes(state.sort ?? '')
  )
    return null
  return { returnTo: state.returnTo, filters, sort: state.sort as SortOrder }
}
