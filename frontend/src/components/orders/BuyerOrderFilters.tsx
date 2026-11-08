import { useId } from 'react'
import type { BuyerOrderFilters as Filters } from '../../types/buyerOrder'
import { buyerOrderStatuses } from '../../utils/buyerOrderUtils'

export default function BuyerOrderFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters
  onChange: (changes: Partial<Filters>) => void
  onClear: () => void
}) {
  const id = useId()
  return (
    <section
      aria-label="Filter demonstration purchases"
      className="rounded-2xl border border-stone-200 bg-white p-5"
    >
      <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <label htmlFor={id + '-search'} className="min-w-0 text-sm font-semibold">
          Search orders
          <input
            id={id + '-search'}
            type="search"
            value={filters.search}
            onChange={event => onChange({ search: event.target.value })}
            placeholder="Reference, product, or sample seller"
            className="mt-2 w-full min-w-0 rounded-lg border border-stone-300 p-3 text-sm"
          />
        </label>
        <label htmlFor={id + '-status'} className="min-w-0 text-sm font-semibold">
          Order status summary
          <select
            id={id + '-status'}
            value={filters.status}
            onChange={event => onChange({ status: event.target.value as Filters['status'] })}
            className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-sm"
          >
            <option value="">All Statuses</option>
            {buyerOrderStatuses.map(status => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Mixed means sellers have different example statuses. A uniform status means every seller has
        that status.
      </p>
      <button
        onClick={onClear}
        className="mt-4 text-sm font-semibold text-emerald-800 underline underline-offset-4"
      >
        Clear Filters
      </button>
    </section>
  )
}
