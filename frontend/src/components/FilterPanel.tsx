import { categoryOptions } from '../data/categories'
import type { ProductFilters } from '../services/filterProducts'

interface FilterPanelProps {
  filters: ProductFilters
  locations: string[]
  error: string | null
  onChange: (changes: Partial<ProductFilters>) => void
  onReset: () => void
}

export default function FilterPanel({ filters, locations, error, onChange, onReset }: FilterPanelProps) {
  const inputClass = 'mt-2 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm'
  return (
    <div className="space-y-7 rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-emerald-950">Filter products</h2>
        <button onClick={onReset} className="text-sm font-semibold text-emerald-800 underline underline-offset-4">Clear All Filters</button>
      </div>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Category</legend>
        <div className="space-y-2">
          {[{ id: '', name: 'All Categories' }, ...categoryOptions].map(category => (
            <label key={category.id} className="flex items-center gap-3 py-1 text-sm">
              <input type="radio" name="category" value={category.id} checked={filters.category === category.id}
                onChange={() => onChange({ category: category.id as ProductFilters['category'] })}
                className="size-4 accent-emerald-700" />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset aria-describedby="price-help">
        <legend className="text-sm font-semibold">Listed price (INR)</legend>
        <p id="price-help" className="mt-2 text-xs leading-5 text-stone-600">Prices are per listed unit (kg or quintal). These amounts do not compare equal quantities.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="min-w-0 text-sm">Minimum
            <input type="number" min="0" step="any" inputMode="decimal" placeholder="No minimum"
              value={filters.minPrice} onChange={event => onChange({ minPrice: event.target.value })}
              aria-invalid={!!error} aria-describedby={error ? 'price-error price-help' : 'price-help'} className={inputClass} />
          </label>
          <label className="min-w-0 text-sm">Maximum
            <input type="number" min="0" step="any" inputMode="decimal" placeholder="No maximum"
              value={filters.maxPrice} onChange={event => onChange({ maxPrice: event.target.value })}
              aria-invalid={!!error} aria-describedby={error ? 'price-error price-help' : 'price-help'} className={inputClass} />
          </label>
        </div>
        {error && <p id="price-error" role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </fieldset>
      <label className="block text-sm font-semibold">Location
        <select value={filters.location} onChange={event => onChange({ location: event.target.value })} className={inputClass}>
          <option value="">All Locations</option>
          {locations.map(location => <option key={location} value={location}>{location}</option>)}
        </select>
      </label>
    </div>
  )
}
