import type { Product } from './product'
import type { OrderStatus } from './seller'

// Reuse the existing status vocabulary; these remain example states.
export type SellerFulfillmentStatus = OrderStatus
export type BuyerOrderStatus = OrderStatus | 'Mixed'

export interface BuyerOrderItem {
  productId: Product['id']
  productName: string
  quantity: number
  unit: Product['unit']
  unitPrice: number
}

export interface BuyerSellerFulfillment {
  sellerName: string
  status: SellerFulfillmentStatus
  items: BuyerOrderItem[]
}

export interface BuyerOrder {
  reference: string
  date: string
  fulfillments: BuyerSellerFulfillment[]
  deliveryCity: string
  deliveryState: string
}

export interface BuyerOrderFilters {
  search: string
  status: BuyerOrderStatus | ''
}
