import type { SellerListingSummary } from '../../types/seller'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function RecentProducts({ listings = [] }: { listings?: SellerListingSummary[] }) {
  return (
    <section aria-labelledby="recent-products-title" className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="recent-products-title" className="text-xl font-bold text-emerald-950">Recent Products</h2>
      <p className="mt-2 text-xs leading-5 text-stone-500">Fictional listings from one demonstration farm. These are separate from Marketplace products.</p>
      {listings.length === 0 ? <p className="mt-6 text-sm text-stone-600">No sample products to display.</p> : (
        <ul className="mt-5 divide-y divide-stone-100">
          {listings.slice(0, 5).map(listing => (
            <li key={listing.id} className="grid min-w-0 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div><h3 className="font-semibold">{listing.name}</h3><p className="mt-1 text-xs text-stone-500 capitalize">{listing.category} - {currency.format(listing.price)} / {listing.unit}</p><p className="mt-2 text-sm text-stone-600">{listing.availableQuantity} {listing.unit} sample stock</p></div>
              <span className={`h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ${!listing.published ? 'bg-stone-100 text-stone-600' : listing.availableQuantity === 0 ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{!listing.published ? 'Draft' : listing.availableQuantity === 0 ? 'Out of stock' : 'Active'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
