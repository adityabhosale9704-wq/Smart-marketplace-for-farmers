import { useEffect, useId, useRef } from 'react'
import type { OrderStatus, SellerOrder } from '../../types/seller'
import {
  allowedOrderStatuses,
  formatSampleOrderDate,
  lineSubtotal,
  sellerOrderSubtotal,
} from '../../utils/sellerOrderUtils'
import OrderStatusBadge from './OrderStatusBadge'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export default function OrderDetails({
  order,
  onClose,
  onStatusChange,
}: {
  order: SellerOrder
  onClose: () => void
  onStatusChange: (next: OrderStatus) => void
}) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const nextStatuses = allowedOrderStatuses(order.status)
  useEffect(() => {
    heading.current?.focus()
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [])

  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">SAMPLE / DEMONSTRATION</p>
          <h2
            ref={heading}
            tabIndex={-1}
            id={id}
            className="mt-3 text-xl font-bold text-emerald-950"
          >
            Order details: {order.reference}
          </h2>
        </div>
        <button onClick={onClose} className="button-secondary">
          Close Details
        </button>
      </div>
      <p className="mt-4 text-sm text-stone-600">
        Sample date: <time dateTime={order.date}>{formatSampleOrderDate(order.date)}</time>
      </p>
      <p className="mt-2 text-sm text-stone-600">Fictional buyer: {order.buyerName}</p>
      <div className="mt-4">
        <OrderStatusBadge status={order.status} />
      </div>
      <ul className="mt-6 divide-y divide-stone-100 border-y border-stone-200">
        {order.items.map(item => (
          <li key={item.listingId} className="py-4">
            <h3 className="font-semibold">{item.productName}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {item.quantity} {item.unit} at {currency.format(item.unitPrice)} per {item.unit}
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-800">
              Line estimate: {currency.format(lineSubtotal(item))}
            </p>
          </li>
        ))}
      </ul>
      {!order.items.length && (
        <p className="mt-4 text-sm text-stone-500">No sample product details available.</p>
      )}
      <h3 className="mt-5 text-sm font-semibold">Seller-specific estimated product subtotal</h3>
      <p className="mt-2 text-2xl font-bold text-emerald-800">
        {currency.format(sellerOrderSubtotal(order))}
      </p>
      <p className="mt-3 text-xs leading-6 text-stone-500">
        Only this demonstration farm's items are shown. kg and quintal quantities are separate
        measures, not a combined weight. Shipping, taxes, and fees are not included. This is not a
        final payable amount or payment confirmation.
      </p>
      <h3 className="mt-5 font-semibold">Fictional delivery location</h3>
      <p className="mt-2 text-sm text-stone-600">
        {order.deliveryCity}, {order.deliveryState} (sample only; no personal address)
      </p>
      {order.deliveryInstructions && (
        <p className="mt-2 text-sm text-stone-600">
          Sample instruction: {order.deliveryInstructions}
        </p>
      )}
      <div className="mt-6 rounded-xl bg-stone-50 p-4">
        <h3 className="font-semibold">Try a demonstration status change</h3>
        <p className="mt-2 text-xs leading-6 text-stone-600">
          Only temporary page state changes. No cancellation, fulfillment, stock deduction,
          notification, payment, or real order processing occurs.
        </p>
        {nextStatuses.length ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {nextStatuses.map(status => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={status === 'Cancelled' ? 'button-secondary' : 'button-primary'}
              >
                Demo: mark {status}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm font-semibold text-stone-600">
            This example is in a final state; no further transitions are allowed.
          </p>
        )}
      </div>
    </section>
  )
}
