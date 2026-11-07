import type { OrderStatus, SellerOrder, SellerOrderCounts, SellerOrderFilters, SellerOrderItem } from '../types/seller'

export const orderStatuses: OrderStatus[] = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

const transitions: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
}

export function allowedOrderStatuses(status: OrderStatus): readonly OrderStatus[] {
  return transitions[status] ?? []
}

export function canChangeOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return allowedOrderStatuses(from).includes(to)
}

export function updateDemoOrderStatus(orders: SellerOrder[], reference: string, next: OrderStatus): SellerOrder[] {
  return orders.map(order => order.reference === reference && canChangeOrderStatus(order.status, next) ? { ...order, status: next } : order)
}

export function lineSubtotal(item: SellerOrderItem): number {
  // Round monetary values to paise, without changing measurement units.
  return Math.round(item.quantity * item.unitPrice * 100) / 100
}

export function sellerOrderSubtotal(order: SellerOrder): number {
  return Math.round(order.items.reduce((sum, item) => sum + lineSubtotal(item), 0) * 100) / 100
}

export function countSellerOrders(orders: SellerOrder[]): SellerOrderCounts {
  return orders.reduce((counts, order) => {
    counts.total++
    counts[order.status]++
    return counts
  }, { total: 0, Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 })
}

export function filterSellerOrders(orders: SellerOrder[], filters: SellerOrderFilters): SellerOrder[] {
  const search = filters.search.trim().replace(/\s+/g, ' ').toLowerCase()
  return orders.filter(order => {
    const text = `${order.reference} ${order.buyerName} ${order.items.map(item => item.productName).join(' ')}`.toLowerCase()
    return text.includes(search) && (!filters.status || order.status === filters.status)
  })
}

export function formatSampleOrderDate(value: string): string {
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date) : 'Sample date unavailable'
}
