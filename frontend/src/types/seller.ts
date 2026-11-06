import type { Product } from './product'

export interface SellerListingSummary {
  id: string
  name: string
  category: Product['category']
  price: number
  unit: Product['unit']
  availableQuantity: number
  lowStockThreshold: number
  published: boolean
}

export interface DemoSellerOrder {
  reference: string
  listingId: SellerListingSummary['id']
  quantity: number
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
}

export interface DashboardStatistics {
  totalProducts: number
  activeListings: number
  outOfStockProducts: number
  incomingOrders: number
  demonstrationSalesValue: number
}


export type SellerProductStatus = 'Active' | 'Draft' | 'Out of Stock'

export interface SellerProductFilters {
  search: string
  category: SellerListingSummary['category'] | ''
  status: SellerProductStatus | ''
}

export interface SellerProductEditValues {
  name: string
  price: string
  stock: string
  status: SellerProductStatus
}

export type SellerProductEditErrors = Partial<Record<keyof SellerProductEditValues, string>>

export interface SellerListingCounts {
  total: number
  active: number
  draft: number
  outOfStock: number
}
