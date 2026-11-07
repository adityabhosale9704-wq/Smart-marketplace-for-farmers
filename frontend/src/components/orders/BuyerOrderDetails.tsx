import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { BuyerOrder } from '../../types/buyerOrder'
import { buyerLineSubtotal, buyerOrderSubtotal, buyerSellerSubtotal } from '../../utils/buyerOrderUtils'
import { formatSampleOrderDate } from '../../utils/sellerOrderUtils'
import OrderStatusBadge from '../seller/OrderStatusBadge'
import OrderProgress from './OrderProgress'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function BuyerOrderDetails({ order, onClose }: { order?: BuyerOrder; onClose: () => void }) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }) }, [])
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }}>
      <div className="flex flex-wrap items-start justify-between gap-4"><h2 ref={heading} tabIndex={-1} id={id} className="text-xl font-bold text-emerald-950">{order ? `Demonstration details: ${order.reference}` : 'Order reference not found'}</h2><button onClick={onClose} className="button-secondary">Close Details</button></div>
      {!order ? <div className="mt-5"><p className="text-sm leading-6 text-stone-600">The order reference is missing or does not match a sample purchase. No real purchase records are available.</p><Link to="/marketplace" className="button-primary mt-5">Browse Marketplace</Link></div> : <>
        <p className="mt-4 text-sm text-stone-600">Sample date: <time dateTime={order.date}>{formatSampleOrderDate(order.date)}</time></p>
        {order.fulfillments.map(fulfillment => <section key={fulfillment.sellerName} className="mt-6 rounded-xl border border-stone-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">{fulfillment.sellerName} (fictional)</h3><OrderStatusBadge status={fulfillment.status} /></div>
          <ul className="mt-3 divide-y divide-stone-100">{fulfillment.items.map(item => <li key={item.productId} className="py-3 text-sm">
            <h4 className="font-semibold">{item.productName}</h4><p className="mt-2 text-stone-600">{item.quantity} {item.unit} at {currency.format(item.unitPrice)} per {item.unit}</p><p className="mt-2 font-semibold text-emerald-800">Line estimate: {currency.format(buyerLineSubtotal(item))}</p>
          </li>)}</ul>
          <p className="mt-3 text-sm font-semibold">Seller product estimate: {currency.format(buyerSellerSubtotal(fulfillment))}</p>
          <OrderProgress status={fulfillment.status} sellerName={fulfillment.sellerName} />
        </section>)}
        {!order.fulfillments.length && <p className="mt-5 text-sm text-stone-600">No sample product or seller information is available.</p>}
        <h3 className="mt-6 font-semibold">Estimated purchase product subtotal</h3><p className="mt-2 text-2xl font-bold text-emerald-800">{currency.format(buyerOrderSubtotal(order))}</p>
        <p className="mt-3 text-xs leading-6 text-stone-500">Different sellers may have different example statuses. Quantities retain their own kg or quintal units; they are not a combined weight. Shipping, taxes, and fees are not included or known. No payment, shipment, or final payable amount is confirmed.</p>
        <p className="mt-5 text-sm text-stone-600">General fictional delivery location: {order.deliveryCity}, {order.deliveryState}. No personal address is shown.</p>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-950">This fictional purchase was not created by the Checkout demonstration. No order or delivery event has occurred.</p>
      </>}
    </section>
  )
}
