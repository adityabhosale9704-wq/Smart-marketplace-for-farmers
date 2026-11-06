import type { SellerListingSummary } from '../../types/seller'
import ProductStatusBadge from './ProductStatusBadge'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function ProductTable({ listings, onEdit, onClear }: { listings: SellerListingSummary[]; onEdit: (id: string) => void; onClear: () => void }) {
  if (listings.length === 0) return (
    <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <h2 className="text-xl font-bold">No demonstration products found</h2>
      <p className="mt-3 text-sm text-stone-600">Try another name, category, or listing status.</p>
      <button onClick={onClear} className="button-secondary mt-5">Clear Filters</button>
    </section>
  )
  return (
    <section aria-label="Demonstration product listings" className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-stone-200 pb-4 text-xs font-semibold text-stone-500 xl:grid" aria-hidden="true">
        <span>Product / category</span><span>Price / unit</span><span>Stock</span><span>Status</span><span>Action</span>
      </div>
      <ul className="divide-y divide-stone-100">
        {listings.map(listing => (
          <li key={listing.id} className="grid min-w-0 gap-4 py-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0"><h2 className="break-words font-semibold text-emerald-950">{listing.name}</h2><p className="mt-1 text-xs text-stone-500 capitalize">{listing.category}</p></div>
            <p className="text-sm"><span className="text-stone-500 xl:sr-only">Price: </span>{currency.format(listing.price)} / {listing.unit}</p>
            <div><p className="text-sm"><span className="text-stone-500 xl:sr-only">Stock: </span>{listing.availableQuantity} {listing.unit}</p>
              {listing.availableQuantity === 0 ? <p className="mt-1 text-xs text-red-700">Zero stock</p> : listing.availableQuantity <= listing.lowStockThreshold ? <p className="mt-1 text-xs text-amber-800">Low stock</p> : null}
            </div>
            <ProductStatusBadge listing={listing} />
            <button id={'edit-' + listing.id} onClick={() => onEdit(listing.id)} aria-label={`View or edit demonstration listing ${listing.name}`} className="w-fit rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">View / Edit</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
