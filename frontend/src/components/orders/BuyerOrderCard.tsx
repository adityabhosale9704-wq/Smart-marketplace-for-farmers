import type { BuyerOrder } from '../../types/buyerOrder'
import { buyerOrderStatus, buyerOrderSubtotal } from '../../utils/buyerOrderUtils'
import { formatSampleOrderDate } from '../../utils/sellerOrderUtils'
import OrderStatusBadge from '../seller/OrderStatusBadge'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export default function BuyerOrderCard({
  order,
  onView,
}: {
  order: BuyerOrder
  onView: () => void
}) {
  const summary = buyerOrderStatus(order)
  return (
    <article className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-emerald-950">{order.reference}</h2>
          <time dateTime={order.date} className="mt-2 block text-xs text-stone-500">
            {formatSampleOrderDate(order.date)}
          </time>
        </div>
        {summary === 'Mixed' ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            Mixed seller statuses
          </span>
        ) : summary ? (
          <OrderStatusBadge status={summary} />
        ) : (
          <span className="text-xs text-stone-500">No status data</span>
        )}
      </div>
      <ul className="mt-5 divide-y divide-stone-100">
        {order.fulfillments.map(fulfillment => (
          <li key={fulfillment.sellerName} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{fulfillment.sellerName} (fictional)</h3>
              <OrderStatusBadge status={fulfillment.status} />
            </div>
            <ul className="mt-2 space-y-1 text-sm text-stone-600">
              {fulfillment.items.map(item => (
                <li key={item.productId}>
                  {item.productName}: {item.quantity} {item.unit}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-stone-100 pt-4">
        <p className="text-sm text-stone-600">
          Estimated product subtotal
          <span className="mt-1 block text-xl font-bold text-emerald-800">
            {currency.format(buyerOrderSubtotal(order))}
          </span>
        </p>
        <button
          id={'buyer-view-' + order.reference}
          onClick={onView}
          aria-label={`View demonstration purchase ${order.reference}`}
          className="button-secondary"
        >
          View Details
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Sample record only. Taxes, shipping, and fees are unknown; this is not a final payable
        amount.
      </p>
    </article>
  )
}
