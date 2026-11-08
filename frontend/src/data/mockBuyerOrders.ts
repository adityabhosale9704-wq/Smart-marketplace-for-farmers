import { mockProducts } from './mockProducts'
import type { BuyerOrder, BuyerOrderItem } from '../types/buyerOrder'

// Independent historical fixtures, never populated by cart/checkout or seller updates.
function samplePurchaseItem(index: number, quantity: number): BuyerOrderItem {
  const product = mockProducts[index]
  return {
    productId: product.id,
    productName: product.name,
    quantity,
    unit: product.unit,
    unitPrice: product.price,
  }
}

export const mockBuyerOrders: BuyerOrder[] = [
  {
    reference: 'SAMPLE-BUY-001',
    date: '2026-11-01',
    fulfillments: [
      {
        sellerName: 'Sample Grower A',
        status: 'Pending',
        items: [samplePurchaseItem(0, 3), samplePurchaseItem(1, 2)],
      },
    ],
    deliveryCity: 'Pune',
    deliveryState: 'Maharashtra',
  },
  {
    reference: 'SAMPLE-BUY-002',
    date: '2026-11-02',
    fulfillments: [
      { sellerName: 'Sample Grower B', status: 'Confirmed', items: [samplePurchaseItem(3, 2)] },
    ],
    deliveryCity: 'Nashik',
    deliveryState: 'Maharashtra',
  },
  {
    reference: 'SAMPLE-BUY-003',
    date: '2026-11-03',
    fulfillments: [
      { sellerName: 'Sample Grower C', status: 'Completed', items: [samplePurchaseItem(4, 1)] },
    ],
    deliveryCity: 'Surat',
    deliveryState: 'Gujarat',
  },
  {
    reference: 'SAMPLE-BUY-004',
    date: '2026-11-04',
    fulfillments: [
      { sellerName: 'Sample Grower A', status: 'Pending', items: [samplePurchaseItem(0, 5)] },
      { sellerName: 'Sample Grower C', status: 'Completed', items: [samplePurchaseItem(4, 2)] },
    ],
    deliveryCity: 'Mumbai',
    deliveryState: 'Maharashtra',
  },
  {
    reference: 'SAMPLE-BUY-005',
    date: '2026-11-05',
    fulfillments: [
      { sellerName: 'Sample Grower D', status: 'Cancelled', items: [samplePurchaseItem(2, 4)] },
    ],
    deliveryCity: 'Indore',
    deliveryState: 'Madhya Pradesh',
  },
  {
    reference: 'SAMPLE-BUY-006',
    date: '2026-11-06',
    fulfillments: [
      { sellerName: 'Sample Grower E', status: 'Completed', items: [samplePurchaseItem(7, 3)] },
    ],
    deliveryCity: 'Nagpur',
    deliveryState: 'Maharashtra',
  },
  {
    reference: 'SAMPLE-BUY-007',
    date: '2026-11-06',
    fulfillments: [
      { sellerName: 'Sample Grower B', status: 'Cancelled', items: [samplePurchaseItem(3, 1)] },
      { sellerName: 'Sample Grower D', status: 'Completed', items: [samplePurchaseItem(6, 2)] },
    ],
    deliveryCity: 'Bhopal',
    deliveryState: 'Madhya Pradesh',
  },
]
