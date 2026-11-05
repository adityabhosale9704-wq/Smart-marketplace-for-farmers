import type { ProductFilters, SortOrder } from '../services/filterProducts'

export interface ProductNavigationState {
  returnTo: string
  filters: ProductFilters
  sort: SortOrder
}
