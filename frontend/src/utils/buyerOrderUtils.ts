import type {
  BuyerOrder,
  BuyerOrderFilters,
  BuyerOrderItem,
  BuyerOrderStatus,
  BuyerSellerFulfillment,
} from '../types/buyerOrder'
import { orderStatuses } from './sellerOrderUtils'

export const buyerOrderStatuses: BuyerOrderStatus[] = [...orderStatuses, 'Mixed']

export function buyerLineSubtotal(item: BuyerOrderItem): number {
  return Math.round(item.quantity * item.unitPrice * 100) / 100
}

export function buyerSellerSubtotal(fulfillment: BuyerSellerFulfillment): number {
  return (
    Math.round(fulfillment.items.reduce((sum, item) => sum + buyerLineSubtotal(item), 0) * 100) /
    100
  )
}

export function buyerOrderSubtotal(order: BuyerOrder): number {
  return (
    Math.round(
      order.fulfillments.reduce((sum, fulfillment) => sum + buyerSellerSubtotal(fulfillment), 0) *
        100,
    ) / 100
  )
}

export function buyerOrderStatus(order: BuyerOrder): BuyerOrderStatus | null {
  const statuses = [...new Set(order.fulfillments.map(fulfillment => fulfillment.status))]
  if (!statuses.length) return null
  return statuses.length === 1 ? statuses[0] : 'Mixed'
}

export function buyerOrderCounts(orders: BuyerOrder[]) {
  return {
    total: orders.length,
    inProgress: orders.filter(order =>
      order.fulfillments.some(
        fulfillment => fulfillment.status === 'Pending' || fulfillment.status === 'Confirmed',
      ),
    ).length,
    completed: orders.filter(order => buyerOrderStatus(order) === 'Completed').length,
  }
}

export function filterBuyerOrders(orders: BuyerOrder[], filters: BuyerOrderFilters): BuyerOrder[] {
  const search = filters.search.trim().replace(/\s+/g, ' ').toLowerCase()
  return orders.filter(order => {
    const text = [
      order.reference,
      ...order.fulfillments.flatMap(fulfillment => [
        fulfillment.sellerName,
        ...fulfillment.items.map(item => item.productName),
      ]),
    ]
      .join(' ')
      .toLowerCase()
    return text.includes(search) && (!filters.status || buyerOrderStatus(order) === filters.status)
  })
}
