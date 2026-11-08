import { useId } from 'react'
import type { SellerOrderFilters } from '../../types/seller'
import { orderStatuses } from '../../utils/sellerOrderUtils'

export default function OrderFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: SellerOrderFilters
  onChange: (changes: Partial<SellerOrderFilters>) => void
  onClear: () => void
}) {
  const id = useId()
  return (
    <section
      aria-label="Filter demonstration orders"
      className="rounded-2xl border border-stone-200 bg-white p-5"
    >
      <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <label htmlFor={id + '-search'} className="min-w-0 text-sm font-semibold">
          Search sample orders
          <input
            id={id + '-search'}
            type="search"
            value={filters.search}
            onChange={event => onChange({ search: event.target.value })}
            placeholder="Order reference, buyer, or product"
            className="mt-2 w-full min-w-0 rounded-lg border border-stone-300 px-3 py-3 text-sm"
          />
        </label>
        <label htmlFor={id + '-status'} className="min-w-0 text-sm font-semibold">
          Example status
          <select
            id={id + '-status'}
            value={filters.status}
            onChange={event =>
              onChange({ status: event.target.value as SellerOrderFilters['status'] })
            }
            className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm"
          >
            <option value="">All Statuses</option>
            {orderStatuses.map(status => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      <button
        onClick={onClear}
        className="mt-4 text-sm font-semibold text-emerald-800 underline underline-offset-4"
      >
        Clear Filters
      </button>
    </section>
  )
}
