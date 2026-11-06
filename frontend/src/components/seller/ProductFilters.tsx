import { useId } from 'react'
import { categoryOptions } from '../../data/categories'
import { sellerProductStatuses } from '../../utils/sellerProductUtils'
import type { SellerProductFilters } from '../../types/seller'

export default function ProductFilters({ filters, onChange, onClear }: { filters: SellerProductFilters; onChange: (changes: Partial<SellerProductFilters>) => void; onClear: () => void }) {
  const id = useId()
  const inputClass = 'mt-2 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm'
  return (
    <section aria-label="Filter seller products" className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label htmlFor={id + '-search'} className="min-w-0 text-sm font-semibold">Search product name
          <input id={id + '-search'} type="search" value={filters.search} onChange={event => onChange({ search: event.target.value })} placeholder="Try tomatoes..." className={inputClass} />
        </label>
        <label htmlFor={id + '-category'} className="min-w-0 text-sm font-semibold">Category
          <select id={id + '-category'} value={filters.category} onChange={event => onChange({ category: event.target.value as SellerProductFilters['category'] })} className={inputClass}>
            <option value="">All Categories</option>
            {categoryOptions.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label htmlFor={id + '-status'} className="min-w-0 text-sm font-semibold">Listing status
          <select id={id + '-status'} value={filters.status} onChange={event => onChange({ status: event.target.value as SellerProductFilters['status'] })} className={inputClass}>
            <option value="">All Statuses</option>
            {sellerProductStatuses.map(status => <option key={status}>{status}</option>)}
          </select>
        </label>
      </div>
      <button onClick={onClear} className="mt-4 text-sm font-semibold text-emerald-800 underline underline-offset-4">Clear Filters</button>
    </section>
  )
}
