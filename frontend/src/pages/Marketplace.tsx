import { useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import FilterPanel from '../components/FilterPanel'
import { mockProducts } from '../data/mockProducts'
import { parseCategory } from '../data/categories'
import { emptyFilters, filterProducts, priceRangeError, readProductNavigationState } from '../services/filterProducts'
import type { ProductFilters, SortOrder } from '../services/filterProducts'

const locations = [...new Set(mockProducts.map(product => product.location))].sort()

export default function Marketplace() {
  const location = useLocation()
  const saved = readProductNavigationState(location.state)
  const [searchParams, setSearchParams] = useSearchParams()
  const [localFilters, setLocalFilters] = useState<ProductFilters>(() => saved?.filters ?? emptyFilters)
  const [sort, setSort] = useState<SortOrder>(() => saved?.sort ?? 'name-asc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const category = parseCategory(searchParams.get('category'))
  const filters = useMemo(() => ({ ...localFilters, category }), [localFilters, category])
  const error = priceRangeError(filters.minPrice, filters.maxPrice)
  const products = useMemo(() => filterProducts(mockProducts, filters, sort), [filters, sort])

  function changeFilters(changes: Partial<ProductFilters>) {
    if (changes.category !== undefined) {
      setSearchParams(previous => {
        const next = new URLSearchParams(previous)
        if (changes.category) next.set('category', changes.category)
        else next.delete('category')
        return next
      }, { replace: true })
    }
    setLocalFilters(previous => ({ ...previous, ...changes }))
  }

  function resetFilters() {
    setLocalFilters({ ...emptyFilters })
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      next.delete('category')
      return next
    }, { replace: true })
    setSort('name-asc')
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50">
        <section className="border-b border-stone-200 bg-emerald-50 py-12">
          <div className="page-width">
            <p className="eyebrow">FROM OUR FARMING COMMUNITY</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">Explore the marketplace</h1>
            <p className="mt-4 max-w-2xl leading-7 text-stone-600">Find produce, discover growers, and explore the harvest. All listings are demonstration data; buying and contacting sellers are not available.</p>
          </div>
        </section>
        <div className="page-width py-8 sm:py-12">
          <label className="flex items-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-700">
            <Search className="size-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <span className="sr-only">Search by product name, category, or seller</span>
            <input type="search" value={filters.search} onChange={event => changeFilters({ search: event.target.value })}
              placeholder="Search products, categories, or sellers" className="min-w-0 w-full py-1 text-sm" />
          </label>
          <div className="mt-7 grid items-start gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside aria-label="Product filters">
              <button onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="marketplace-filters"
                className="mb-3 flex w-full items-center justify-between rounded-lg border border-stone-300 bg-white p-3 text-sm font-semibold lg:hidden">
                {filtersOpen ? 'Hide filters' : 'Show filters'}<SlidersHorizontal className="size-4" aria-hidden="true" />
              </button>
              <div id="marketplace-filters" className={filtersOpen ? 'block' : 'hidden lg:block'}>
                <FilterPanel filters={filters} locations={locations} error={error} onChange={changeFilters} onReset={resetFilters} />
              </div>
            </aside>
            <section aria-label="Product results" className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p role="status" className="text-sm font-semibold">{error ? 'Correct the price range to see results' : `${products.length} sample product${products.length === 1 ? '' : 's'} found`}</p>
                <label className="flex flex-wrap items-center gap-2 text-sm">Sort by
                  <select value={sort} onChange={event => setSort(event.target.value as SortOrder)} className="max-w-full rounded-lg border border-stone-300 bg-white p-2.5">
                    <option value="name-asc">Name A to Z</option>
                    <option value="name-desc">Name Z to A</option>
                    <option value="price-asc">Price Low to High</option>
                    <option value="price-desc">Price High to Low</option>
                  </select>
                </label>
              </div>
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">Prices and price sorting use the numeric amount per listed unit. A kg and a quintal represent different quantities; this is not a like-for-like price comparison.</p>
              {products.length > 0 ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map(product => <ProductCard key={product.id} product={product} navigationState={{ returnTo: location.pathname + location.search, filters, sort }} />)}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
                  <h2 className="text-xl font-bold">{error ? 'Check your price filters' : 'No sample products found'}</h2>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{error ?? 'Try a different search, choose another category or location, or reset your filters.'}</p>
                  <button onClick={resetFilters} className="button-primary mt-5">Reset Filters</button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
