import type { SellerOrder } from '../../types/seller'
import { formatSampleOrderDate, sellerOrderSubtotal } from '../../utils/sellerOrderUtils'
import OrderStatusBadge from './OrderStatusBadge'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export default function OrderTable({
  orders,
  onView,
  onClear,
}: {
  orders: SellerOrder[]
  onView: (reference: string) => void
  onClear: () => void
}) {
  if (!orders.length)
    return (
      <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <h2 className="text-xl font-bold">No demonstration orders found</h2>
        <p className="mt-3 text-sm text-stone-600">
          Try another reference, sample buyer, product, or status.
        </p>
        <button onClick={onClear} className="button-secondary mt-5">
          Clear Filters
        </button>
      </section>
    )
  return (
    <section
      aria-label="Seller demonstration order list"
      className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5"
    >
      <ul className="divide-y divide-stone-100">
        {orders.map(order => (
          <li
            key={order.reference}
            className="grid min-w-0 items-start gap-4 py-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <h2 className="font-bold text-emerald-950">{order.reference}</h2>
              <time dateTime={order.date} className="mt-2 block text-xs text-stone-500">
                {formatSampleOrderDate(order.date)}
              </time>
              <p className="mt-2 break-words text-sm text-stone-600">
                {order.items.length
                  ? order.items.map(item => item.productName).join(', ')
                  : 'No sample line items'}
              </p>
              <p className="mt-2 text-xs text-stone-500">{order.buyerName} (fictional)</p>
            </div>
            <p className="text-sm text-stone-600">
              Seller product estimate
              <span className="mt-2 block font-bold text-emerald-800">
                {currency.format(sellerOrderSubtotal(order))}
              </span>
            </p>
            <OrderStatusBadge status={order.status} />
            <button
              id={'view-' + order.reference}
              onClick={() => onView(order.reference)}
              aria-label={`View details for demonstration order ${order.reference}`}
              className="w-fit rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              View Details
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
