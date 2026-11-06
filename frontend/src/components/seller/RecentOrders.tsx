import type { DemoSellerOrder, SellerListingSummary } from '../../types/seller'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function RecentOrders({ orders = [], listings = [] }: { orders?: DemoSellerOrder[]; listings?: SellerListingSummary[] }) {
  return (
    <section aria-labelledby="recent-orders-title" className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="recent-orders-title" className="text-xl font-bold text-emerald-950">Recent Orders</h2>
      <p className="mt-2 text-xs leading-5 text-stone-500">SAMPLE / DEMONSTRATION records only. No real orders, payments, or delivery arrangements exist.</p>
      {orders.length === 0 ? <p className="mt-6 text-sm text-stone-600">No sample orders to display.</p> : (
        <ul className="mt-5 divide-y divide-stone-100">
          {orders.slice(0, 5).map(order => {
            const listing = listings.find(item => item.id === order.listingId)
            return (
              <li key={order.reference} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold text-stone-600">{order.reference}</h3><span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">Example: {order.status}</span></div>
                {listing ? <><p className="mt-3 font-semibold">{listing.name}</p><p className="mt-2 text-sm text-stone-600">{order.quantity} {listing.unit} - Estimated product amount: {currency.format(order.quantity * listing.price)}</p></> : <p className="mt-3 text-sm text-stone-600">Sample product is no longer available. Amount cannot be calculated.</p>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
