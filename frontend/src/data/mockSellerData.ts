import { sellerListingCounts } from '../utils/sellerProductUtils'
import { sellerOrderSubtotal } from '../utils/sellerOrderUtils'
import type { DashboardStatistics, SellerOrder, SellerOrderItem, SellerListingSummary } from '../types/seller'

// An isolated fictional farm catalogue, not ownership of Marketplace listings.
export const mockSellerListings: SellerListingSummary[] = [
  { id: 'demo-farm-tomatoes', name: 'Red Tomatoes', category: 'vegetables', price: 32, unit: 'kg', availableQuantity: 120, lowStockThreshold: 20, published: true },
  { id: 'demo-farm-onions', name: 'Red Onions', category: 'vegetables', price: 28, unit: 'kg', availableQuantity: 12, lowStockThreshold: 20, published: true },
  { id: 'demo-farm-wheat', name: 'Golden Wheat', category: 'grains', price: 2600, unit: 'quintal', availableQuantity: 0, lowStockThreshold: 2, published: true },
  { id: 'demo-farm-tur-dal', name: 'Tur Dal', category: 'pulses', price: 135, unit: 'kg', availableQuantity: 45, lowStockThreshold: 10, published: true },
  { id: 'demo-farm-coriander', name: 'Coriander Seeds', category: 'seeds', price: 150, unit: 'kg', availableQuantity: 30, lowStockThreshold: 5, published: false },
]

// Historical line snapshots belong only to this fictional farm, never to other sellers.
function sampleItem(index: number, quantity: number): SellerOrderItem {
  const listing = mockSellerListings[index]
  return { listingId: listing.id, productName: listing.name, quantity, unit: listing.unit, unitPrice: listing.price }
}

export const mockSellerOrders: SellerOrder[] = [
  { reference: 'SAMPLE-001', buyerName: 'Sample Buyer A', date: '2026-11-01', items: [sampleItem(0, 10)], status: 'Pending', deliveryCity: 'Pune', deliveryState: 'Maharashtra' },
  { reference: 'SAMPLE-002', buyerName: 'Sample Buyer B', date: '2026-11-02', items: [sampleItem(1, 5)], status: 'Confirmed', deliveryCity: 'Nashik', deliveryState: 'Maharashtra' },
  { reference: 'SAMPLE-003', buyerName: 'Sample Buyer C', date: '2026-11-03', items: [sampleItem(3, 8)], status: 'Completed', deliveryCity: 'Nagpur', deliveryState: 'Maharashtra' },
  { reference: 'SAMPLE-004', buyerName: 'Sample Buyer D', date: '2026-11-03', items: [sampleItem(0, 15)], status: 'Completed', deliveryCity: 'Mumbai', deliveryState: 'Maharashtra' },
  { reference: 'SAMPLE-005', buyerName: 'Sample Buyer E', date: '2026-11-04', items: [sampleItem(0, 2), sampleItem(1, 3)], status: 'Pending', deliveryCity: 'Thane', deliveryState: 'Maharashtra', deliveryInstructions: 'Sample instruction only: discuss the delivery window before dispatch.' },
  { reference: 'SAMPLE-006', buyerName: 'Sample Buyer F', date: '2026-11-05', items: [sampleItem(3, 4)], status: 'Confirmed', deliveryCity: 'Indore', deliveryState: 'Madhya Pradesh' },
  { reference: 'SAMPLE-007', buyerName: 'Sample Buyer G', date: '2026-11-05', items: [sampleItem(2, 1), sampleItem(0, 2)], status: 'Cancelled', deliveryCity: 'Bhopal', deliveryState: 'Madhya Pradesh', deliveryInstructions: 'Historical cancelled sample; no delivery should be inferred.' },
  { reference: 'SAMPLE-008', buyerName: 'Sample Buyer H', date: '2026-11-06', items: [sampleItem(1, 2)], status: 'Pending', deliveryCity: 'Surat', deliveryState: 'Gujarat' },
]

// Order snapshots remain readable even if a current listing is absent.
export function deriveSellerStatistics(listings: SellerListingSummary[] = [], orders: SellerOrder[] = []): DashboardStatistics {
  const counts = sellerListingCounts(listings)
  return {
    totalProducts: counts.total,
    activeListings: counts.active,
    outOfStockProducts: counts.outOfStock,
    incomingOrders: orders.filter(order => order.status === 'Pending' || order.status === 'Confirmed').length,
    demonstrationSalesValue: orders.reduce((sum, order) => sum + (order.status === 'Completed' ? sellerOrderSubtotal(order) : 0), 0),
  }
}
