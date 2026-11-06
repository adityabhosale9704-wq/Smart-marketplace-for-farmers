import { sellerListingCounts } from '../utils/sellerProductUtils'
import type { DashboardStatistics, DemoSellerOrder, SellerListingSummary } from '../types/seller'

// An isolated fictional farm catalogue, not ownership of Marketplace listings.
export const mockSellerListings: SellerListingSummary[] = [
  { id: 'demo-farm-tomatoes', name: 'Red Tomatoes', category: 'vegetables', price: 32, unit: 'kg', availableQuantity: 120, lowStockThreshold: 20, published: true },
  { id: 'demo-farm-onions', name: 'Red Onions', category: 'vegetables', price: 28, unit: 'kg', availableQuantity: 12, lowStockThreshold: 20, published: true },
  { id: 'demo-farm-wheat', name: 'Golden Wheat', category: 'grains', price: 2600, unit: 'quintal', availableQuantity: 0, lowStockThreshold: 2, published: true },
  { id: 'demo-farm-tur-dal', name: 'Tur Dal', category: 'pulses', price: 135, unit: 'kg', availableQuantity: 45, lowStockThreshold: 10, published: true },
  { id: 'demo-farm-coriander', name: 'Coriander Seeds', category: 'seeds', price: 150, unit: 'kg', availableQuantity: 30, lowStockThreshold: 5, published: false },
]

export const mockSellerOrders: DemoSellerOrder[] = [
  { reference: 'SAMPLE-001', listingId: 'demo-farm-tomatoes', quantity: 10, status: 'Pending' },
  { reference: 'SAMPLE-002', listingId: 'demo-farm-onions', quantity: 5, status: 'Confirmed' },
  { reference: 'SAMPLE-003', listingId: 'demo-farm-tur-dal', quantity: 8, status: 'Completed' },
  { reference: 'SAMPLE-004', listingId: 'demo-farm-tomatoes', quantity: 15, status: 'Completed' },
]

// All statistics are derived. Missing product references are excluded from order figures.
export function deriveSellerStatistics(listings: SellerListingSummary[] = [], orders: DemoSellerOrder[] = []): DashboardStatistics {
  const counts = sellerListingCounts(listings)
  const validOrders = orders.filter(order => listings.some(listing => listing.id === order.listingId))
  return {
    totalProducts: counts.total,
    activeListings: counts.active,
    outOfStockProducts: counts.outOfStock,
    incomingOrders: validOrders.filter(order => order.status === 'Pending' || order.status === 'Confirmed').length,
    demonstrationSalesValue: validOrders.reduce((sum, order) => {
      const listing = listings.find(item => item.id === order.listingId)
      return sum + (order.status === 'Completed' && listing ? listing.price * order.quantity : 0)
    }, 0),
  }
}
