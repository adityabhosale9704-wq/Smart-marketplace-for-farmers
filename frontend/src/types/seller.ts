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
