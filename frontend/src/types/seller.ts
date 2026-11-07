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

export type OrderStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'

export interface SellerOrderItem {
  listingId: SellerListingSummary['id']
  productName: string
  quantity: number
  unit: Product['unit']
  unitPrice: number
}

export interface SellerOrder {
  reference: string
  buyerName: string
  date: string
  items: SellerOrderItem[]
  status: OrderStatus
  deliveryCity: string
  deliveryState: string
  deliveryInstructions?: string
}

export interface SellerOrderFilters {
  search: string
  status: OrderStatus | ''
}

export interface SellerOrderCounts {
  total: number
  Pending: number
  Confirmed: number
  Completed: number
  Cancelled: number
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
