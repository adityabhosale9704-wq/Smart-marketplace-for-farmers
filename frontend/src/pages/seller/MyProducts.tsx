import { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/authContextValue'
import { getMyProducts, updateProduct } from '../../services/products'
import { Package, CircleCheck, FilePenLine, PackageX, PackagePlus } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import SellerSidebar from '../../components/seller/SellerSidebar'
import StatCard from '../../components/seller/StatCard'
import ProductFilters from '../../components/seller/ProductFilters'
import ProductTable from '../../components/seller/ProductTable'
import EditProductPanel from '../../components/seller/EditProductPanel'
import type {
  SellerListingSummary,
  SellerProductEditValues,
  SellerProductFilters,
} from '../../types/seller'
import { filterSellerProducts, sellerListingCounts } from '../../utils/sellerProductUtils'

const emptyFilters: SellerProductFilters = { search: '', category: '', status: '' }

export default function MyProducts() {
  const auth = useContext(AuthContext)
  const userId = auth?.session?.user.id
  const location = useLocation()
  const savedProductId = (location.state as { savedProductId?: string } | null)?.savedProductId
  const [loaded, setLoaded] = useState<{ userId: string; rows: SellerListingSummary[] } | null>(
    null,
  )
  const listings = loaded && loaded.userId === userId ? loaded.rows : []
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [retry, setRetry] = useState(0)
  const pending = useRef<AbortController | null>(null)
  const [filters, setFilters] = useState<SellerProductFilters>({ ...emptyFilters })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const title = useRef<HTMLHeadingElement>(null)
  const counts = sellerListingCounts(listings)
  const filtered = filterSellerProducts(listings, filters)
  const editing = listings.find(listing => listing.id === editingId)

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    pending.current = controller
    // Synchronize seller listings with the verified account.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoaded(null)
    setError('')
    setNotice('')
    setEditingId(null)
    setSaving(false)
    getMyProducts(userId, controller.signal)
      .then(rows => {
        if (!controller.signal.aborted) {
          setLoaded({ userId, rows })
          if (rows.some(row => row.id === savedProductId))
            setNotice('Your saved product is listed below.')
        }
      })
      .catch(failure => {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error ? failure.message : 'Your products could not be loaded.',
          )
      })
    return () => controller.abort()
  }, [userId, retry, savedProductId])

  function closeEditor() {
    const button = editingId ? document.getElementById('edit-' + editingId) : null
    setEditingId(null)
    if (button) button.focus()
    else title.current?.focus()
  }

  async function apply(values: SellerProductEditValues) {
    const controller = pending.current
    if (!userId || !editingId || !controller || controller.signal.aborted || saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await updateProduct(userId, editingId, values, controller.signal)
      const rows = await getMyProducts(userId, controller.signal)
      if (!controller.signal.aborted) {
        setLoaded({ userId, rows })
        setNotice('Product changes saved. Current filters still apply.')
        setEditingId(null)
        title.current?.focus()
      }
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : 'Your product could not be saved.')
    } finally {
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-8 sm:py-12">
        <div className="page-width">
          <p className="mb-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            These listings are loaded from your farmer account. Drafts stay private. Published,
            in-stock products appear in the Marketplace. Order pages still use demonstration data.
          </p>
          <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
            <SellerSidebar />
            <div className="min-w-0 space-y-6">
              <header className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h1 ref={title} tabIndex={-1} className="text-3xl font-bold text-emerald-950">
                    My Products
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-stone-600">
                    View and edit your saved products. Your changes remain in the database after
                    refresh.
                  </p>
                </div>
                <Link to="/seller/add-product" className="button-primary">
                  <PackagePlus className="size-4" aria-hidden="true" />
                  Add New Product
                </Link>
              </header>
              {auth?.checking ? (
                <p role="status">Checking your session...</p>
              ) : !userId ? (
                <p>
                  Please{' '}
                  <Link to="/login" className="text-emerald-800 underline">
                    log in
                  </Link>{' '}
                  to view your products.
                </p>
              ) : (
                <>
                  {error && (
                    <p role="alert" className="text-sm text-red-700">
                      {error}
                    </p>
                  )}
                  {loaded?.userId !== userId ? (
                    error ? (
                      <button
                        className="button-secondary"
                        onClick={() => setRetry(previous => previous + 1)}
                      >
                        Try Again
                      </button>
                    ) : (
                      <p role="status">Loading your products...</p>
                    )
                  ) : (
                    <>
                      <section
                        aria-label="Your product statistics"
                        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                      >
                        <StatCard
                          label="Total Products"
                          value={counts.total}
                          explanation="All current page listings."
                          icon={Package}
                        />
                        <StatCard
                          label="Active Products"
                          value={counts.active}
                          explanation="Active status with positive stock."
                          icon={CircleCheck}
                        />
                        <StatCard
                          label="Draft Products"
                          value={counts.draft}
                          explanation="Drafts, including zero-stock drafts."
                          icon={FilePenLine}
                        />
                        <StatCard
                          label="Out of Stock"
                          value={counts.outOfStock}
                          explanation="Non-draft listings with zero stock."
                          icon={PackageX}
                        />
                      </section>
                      <p role="status" className="text-sm leading-6 text-emerald-900">
                        {notice}
                      </p>
                      {editing && (
                        <EditProductPanel
                          key={editing.id}
                          listing={editing}
                          saving={saving}
                          onApply={apply}
                          onCancel={closeEditor}
                        />
                      )}
                      <ProductFilters
                        filters={filters}
                        onChange={changes => setFilters(previous => ({ ...previous, ...changes }))}
                        onClear={() => setFilters({ ...emptyFilters })}
                      />
                      <p role="status" className="text-sm text-stone-600">
                        {filtered.length} of {listings.length} products shown. Statistics include
                        all page listings.
                      </p>
                      <ProductTable
                        listings={filtered}
                        onEdit={id => {
                          setEditingId(id)
                          setNotice('')
                        }}
                        onClear={() => setFilters({ ...emptyFilters })}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
