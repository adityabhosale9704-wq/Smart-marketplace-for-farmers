import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, CircleCheck, FilePenLine, PackageX, PackagePlus } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import SellerSidebar from '../../components/seller/SellerSidebar'
import StatCard from '../../components/seller/StatCard'
import ProductFilters from '../../components/seller/ProductFilters'
import ProductTable from '../../components/seller/ProductTable'
import EditProductPanel from '../../components/seller/EditProductPanel'
import { mockSellerListings } from '../../data/mockSellerData'
import type { SellerProductEditValues, SellerProductFilters } from '../../types/seller'
import { applySellerEdit, filterSellerProducts, sellerListingCounts } from '../../utils/sellerProductUtils'

const emptyFilters: SellerProductFilters = { search: '', category: '', status: '' }

export default function MyProducts() {
  // Clone each sample listing so temporary edits never mutate the shared seed.
  const [listings, setListings] = useState(() => mockSellerListings.map(listing => ({ ...listing })))
  const [filters, setFilters] = useState<SellerProductFilters>({ ...emptyFilters })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const title = useRef<HTMLHeadingElement>(null)
  const counts = useMemo(() => sellerListingCounts(listings), [listings])
  const filtered = useMemo(() => filterSellerProducts(listings, filters), [listings, filters])
  const editing = listings.find(listing => listing.id === editingId)

  function closeEditor() {
    const button = editingId ? document.getElementById('edit-' + editingId) : null
    setEditingId(null)
    if (button) button.focus()
    else title.current?.focus()
  }

  function apply(values: SellerProductEditValues) {
    setListings(previous => previous.map(listing => listing.id === editingId ? applySellerEdit(listing, values) : listing))
    setNotice('Demo changes applied on this page only. Current filters still apply; an edited listing may no longer match. Nothing was saved or published.')
    setEditingId(null)
    title.current?.focus()
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-8 sm:py-12">
        <div className="page-width">
          <p className="mb-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Public demonstration without login. These fictional seller listings are independent of Marketplace products and unsaved Add Product previews. One future farmer account supports buying and selling.</p>
          <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
            <SellerSidebar />
            <div className="min-w-0 space-y-6">
              <header className="flex flex-wrap items-start justify-between gap-5">
                <div><h1 ref={title} tabIndex={-1} className="text-3xl font-bold text-emerald-950">My Products</h1><p className="mt-3 max-w-xl text-sm leading-7 text-stone-600">Explore and edit seeded sample listings. Changes exist only here and disappear when you leave or refresh this page. Dashboard data stays unchanged.</p></div>
                <Link to="/seller/add-product" className="button-primary"><PackagePlus className="size-4" aria-hidden="true" />Add New Product</Link>
              </header>
              <section aria-label="Demonstration product statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Products" value={counts.total} explanation="All current page listings." icon={Package} />
                <StatCard label="Active Products" value={counts.active} explanation="Active status with positive stock." icon={CircleCheck} />
                <StatCard label="Draft Products" value={counts.draft} explanation="Drafts, including zero-stock drafts." icon={FilePenLine} />
                <StatCard label="Out of Stock" value={counts.outOfStock} explanation="Non-draft listings with zero stock." icon={PackageX} />
              </section>
              <p role="status" className="text-sm leading-6 text-emerald-900">{notice}</p>
              {editing && <EditProductPanel key={editing.id} listing={editing} onApply={apply} onCancel={closeEditor} />}
              <ProductFilters filters={filters} onChange={changes => setFilters(previous => ({ ...previous, ...changes }))} onClear={() => setFilters({ ...emptyFilters })} />
              <p role="status" className="text-sm text-stone-600">{filtered.length} of {listings.length} demonstration products shown. Statistics include all page listings.</p>
              <ProductTable listings={filtered} onEdit={id => { setEditingId(id); setNotice('') }} onClear={() => setFilters({ ...emptyFilters })} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
