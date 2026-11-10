import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import FilterPanel from '../components/FilterPanel'
import { getMarketplaceProducts } from '../services/products'
import type { Product } from '../types/product'
import { parseCategory } from '../data/categories'
import {
  emptyFilters,
  filterProducts,
  priceRangeError,
  readProductNavigationState,
} from '../services/filterProducts'
import type { ProductFilters, SortOrder } from '../services/filterProducts'

export default function Marketplace() {
  const location = useLocation()
  const saved = readProductNavigationState(location.state)
  const [searchParams, setSearchParams] = useSearchParams()
  const [localFilters, setLocalFilters] = useState<ProductFilters>(() => ({
    ...(saved?.filters ?? emptyFilters),
    search: searchParams.get('search') ?? saved?.filters.search ?? '',
    location: searchParams.get('location') ?? saved?.filters.location ?? '',
    minPrice: searchParams.get('minPrice') ?? saved?.filters.minPrice ?? '',
    maxPrice: searchParams.get('maxPrice') ?? saved?.filters.maxPrice ?? '',
  }))
  const [sort, setSort] = useState<SortOrder>(() => saved?.sort ?? 'name-asc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const category = parseCategory(searchParams.get('category'))
  const filters = useMemo(() => ({ ...localFilters, category }), [localFilters, category])
  const error = priceRangeError(filters.minPrice, filters.maxPrice)
  const requestKey = JSON.stringify(filters)
  const [loaded, setLoaded] = useState<{
    key: string
    products: Product[]
    locations: string[]
    sellerNamesAvailable: boolean
  } | null>(null)
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null)
  const [retry, setRetry] = useState(0)
  const current = loaded?.key === requestKey ? loaded : null
  const fetchError = failure?.key === requestKey ? failure.message : ''
  const loading = !error && !current && !fetchError
  const products = current ? filterProducts(current.products, emptyFilters, sort) : []
  const locations = loaded?.locations ?? []

  useEffect(() => {
    if (error) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      getMarketplaceProducts(filters, controller.signal)
        .then(result => {
          if (!controller.signal.aborted) {
            setLoaded({ key: requestKey, ...result })
            setFailure(null)
          }
        })
        .catch(reason => {
          if (!controller.signal.aborted)
            setFailure({
              key: requestKey,
              message:
                reason instanceof Error
                  ? reason.message
                  : 'Marketplace listings could not be loaded.',
            })
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [filters, error, requestKey, retry])

  function changeFilters(changes: Partial<ProductFilters>) {
    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )
    setLocalFilters(previous => ({ ...previous, ...changes }))
  }

  function resetFilters() {
    setLocalFilters({ ...emptyFilters })
    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous)
        for (const key of Object.keys(emptyFilters)) next.delete(key)
        return next
      },
      { replace: true },
    )
    setSort('name-asc')
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50">
        <section className="border-b border-stone-200 bg-emerald-50 py-12">
          <div className="page-width">
            <p className="eyebrow">FROM OUR FARMING COMMUNITY</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
              Explore the marketplace
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-stone-600">
              Browse published, in-stock products from our farming community. Product details and
              purchasing are not connected yet.
            </p>
          </div>
        </section>
        <div className="page-width py-8 sm:py-12">
          <label className="flex items-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-700">
            <Search className="size-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <span className="sr-only">Search by product name</span>
            <input
              type="search"
              value={filters.search}
              onChange={event => changeFilters({ search: event.target.value })}
              placeholder="Search product names"
              maxLength={100}
              className="min-w-0 w-full py-1 text-sm"
            />
          </label>
          <div className="mt-7 grid items-start gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside aria-label="Product filters">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
                aria-controls="marketplace-filters"
                className="mb-3 flex w-full items-center justify-between rounded-lg border border-stone-300 bg-white p-3 text-sm font-semibold lg:hidden"
              >
                {filtersOpen ? 'Hide filters' : 'Show filters'}
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </button>
              <div id="marketplace-filters" className={filtersOpen ? 'block' : 'hidden lg:block'}>
                <FilterPanel
                  filters={filters}
                  locations={locations}
                  error={error}
                  onChange={changeFilters}
                  onReset={resetFilters}
                />
              </div>
            </aside>
            <section aria-label="Product results" className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p role="status" className="text-sm font-semibold">
                  {error
                    ? 'Correct the price range to see results'
                    : loading
                      ? 'Loading products...'
                      : fetchError
                        ? 'Products could not be loaded'
                        : `${products.length} product${products.length === 1 ? '' : 's'} found`}
                </p>
                <label className="flex flex-wrap items-center gap-2 text-sm">
                  Sort by
                  <select
                    value={sort}
                    onChange={event => setSort(event.target.value as SortOrder)}
                    className="max-w-full rounded-lg border border-stone-300 bg-white p-2.5"
                  >
                    <option value="name-asc">Name A to Z</option>
                    <option value="name-desc">Name Z to A</option>
                    <option value="price-asc">Price Low to High</option>
                    <option value="price-desc">Price High to Low</option>
                  </select>
                </label>
              </div>
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                Prices and price sorting use the numeric amount per listed unit. A kg and a quintal
                represent different quantities; this is not a like-for-like price comparison.
              </p>
              {current && !current.sellerNamesAvailable && (
                <p role="status" className="mt-4 text-sm text-amber-900">
                  Seller display names are temporarily unavailable. You can still browse the product
                  listings.
                </p>
              )}
              {fetchError ? (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                  <p role="alert" className="text-sm text-red-800">
                    {fetchError}
                  </p>
                  <button
                    onClick={() => {
                      setFailure(null)
                      setRetry(previous => previous + 1)
                    }}
                    className="button-secondary mt-4"
                  >
                    Try Again
                  </button>
                </div>
              ) : loading ? (
                <p role="status" className="mt-6">
                  Loading marketplace listings...
                </p>
              ) : products.length > 0 ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      demo={false}
                      navigationState={{
                        returnTo: location.pathname + location.search,
                        filters,
                        sort,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
                  <h2 className="text-xl font-bold">
                    {error ? 'Check your price filters' : 'No products found'}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {error ??
                      'Try a different search, choose another category or location, or reset your filters.'}
                  </p>
                  <button onClick={resetFilters} className="button-primary mt-5">
                    Reset Filters
                  </button>
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
