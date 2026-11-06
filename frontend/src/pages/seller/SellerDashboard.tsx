import { Link } from 'react-router-dom'
import { Package, CircleCheck, PackageX, ClipboardList, IndianRupee, PackagePlus, TriangleAlert } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import SellerSidebar from '../../components/seller/SellerSidebar'
import StatCard from '../../components/seller/StatCard'
import RecentProducts from '../../components/seller/RecentProducts'
import RecentOrders from '../../components/seller/RecentOrders'
import { deriveSellerStatistics, mockSellerListings, mockSellerOrders } from '../../data/mockSellerData'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function SellerDashboard() {
  const stats = deriveSellerStatistics(mockSellerListings, mockSellerOrders)
  const lowStock = mockSellerListings.filter(listing => listing.availableQuantity <= listing.lowStockThreshold)
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-8 sm:py-12">
        <div className="page-width">
          <div className="mb-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Demonstration preview - accessible without login.</strong> All listings, orders, and figures below are fictional. No authenticated farmer, real sales, or inventory operations are represented.
          </div>
          <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
            <SellerSidebar />
            <div className="min-w-0 space-y-7">
              <header className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-xl"><p className="eyebrow">GROW YOUR POSSIBILITIES</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950">Welcome to your seller preview</h1><p className="mt-4 text-sm leading-7 text-stone-600">Explore how a future dashboard could bring your products, incoming orders, and stock together. One farmer account will support both buying and selling.</p></div>
                <Link to="/seller/add-product" className="button-primary"><PackagePlus aria-hidden="true" className="size-4" />Add New Product</Link>
              </header>
              <section aria-label="Demonstration statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Total Products" value={stats.totalProducts} explanation="All sample listings, including drafts." icon={Package} />
                <StatCard label="Active Listings" value={stats.activeListings} explanation="Published sample listings with stock." icon={CircleCheck} />
                <StatCard label="Out of Stock Products" value={stats.outOfStockProducts} explanation="Sample listings with zero stock." icon={PackageX} />
                <StatCard label="Incoming Orders" value={stats.incomingOrders} explanation="Pending and confirmed sample records." icon={ClipboardList} />
                <StatCard label="Demonstration Sales Value" value={currency.format(stats.demonstrationSalesValue)} explanation="Completed sample order quantities multiplied by listed prices. Not real revenue; excludes fees and delivery." icon={IndianRupee} />
              </section>
              <div className="grid items-start gap-6 xl:grid-cols-2">
                <RecentProducts listings={mockSellerListings} />
                <RecentOrders orders={mockSellerOrders} listings={mockSellerListings} />
              </div>
              <section aria-labelledby="stock-overview-title" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
                <h2 id="stock-overview-title" className="text-xl font-bold text-emerald-950">Stock overview</h2>
                <p className="mt-2 text-xs leading-6 text-stone-500">Derived from each sample listing's stock and low-stock threshold. Different units are assessed separately; these are not live inventory alerts.</p>
                {lowStock.length === 0 ? <p className="mt-5 text-sm text-stone-600">No low-stock or zero-stock sample listings.</p> : <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {lowStock.map(listing => <li key={listing.id} className={`rounded-xl border p-4 ${listing.availableQuantity === 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="flex items-center gap-2"><TriangleAlert aria-hidden="true" className="size-4 shrink-0" /><h3 className="font-semibold">{listing.name}</h3></div>
                    <p className="mt-2 text-sm">{listing.availableQuantity === 0 ? 'Out of stock' : 'Low stock'}: {listing.availableQuantity} {listing.unit}</p>
                    <p className="mt-2 text-xs text-stone-600">Sample alert threshold: {listing.lowStockThreshold} {listing.unit}</p>
                  </li>)}
                </ul>}
              </section>
              <p className="text-xs leading-6 text-stone-500">This public UI provides no authorization or ownership checks. Future integration must identify the farmer through real authentication and enforce seller ownership on the backend.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
