import { Link } from 'react-router-dom'
import type { SellerOrder } from '../../types/seller'
import { sellerOrderSubtotal } from '../../utils/sellerOrderUtils'
import OrderStatusBadge from './OrderStatusBadge'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function RecentOrders({ orders = [] }: { orders?: SellerOrder[] }) {
  return (
    <section aria-labelledby="recent-orders-title" className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="recent-orders-title" className="text-xl font-bold text-emerald-950">Recent Orders</h2>
      <p className="mt-2 text-xs leading-5 text-stone-500">SAMPLE / DEMONSTRATION records only. No real orders, payments, or delivery arrangements exist.</p>
      <Link to="/seller/orders" className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4">View Seller Orders</Link>
      {orders.length === 0 ? <p className="mt-6 text-sm text-stone-600">No sample orders to display.</p> : (
        <ul className="mt-5 divide-y divide-stone-100">
          {orders.slice(-5).reverse().map(order => <li key={order.reference} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold text-stone-600">{order.reference}</h3><OrderStatusBadge status={order.status} /></div>
            <p className="mt-3 text-sm font-semibold">{order.items.length ? order.items.map(item => item.productName).join(', ') : 'No sample items'}</p>
            <p className="mt-2 text-sm text-stone-600">Seller product estimate: {currency.format(sellerOrderSubtotal(order))}</p>
          </li>)}
        </ul>
      )}
    </section>
  )
}
