import { useMemo, useRef, useState } from 'react'
import { ClipboardList, Clock, CircleCheck, PackageCheck } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import SellerSidebar from '../../components/seller/SellerSidebar'
import StatCard from '../../components/seller/StatCard'
import OrderFilters from '../../components/seller/OrderFilters'
import OrderTable from '../../components/seller/OrderTable'
import OrderDetails from '../../components/seller/OrderDetails'
import { mockSellerOrders } from '../../data/mockSellerData'
import {
  countSellerOrders,
  filterSellerOrders,
  updateDemoOrderStatus,
} from '../../utils/sellerOrderUtils'
import type { OrderStatus, SellerOrderFilters } from '../../types/seller'

const emptyFilters: SellerOrderFilters = { search: '', status: '' }

export default function SellerOrders() {
  const [orders, setOrders] = useState(() =>
    mockSellerOrders.map(order => ({
      ...order,
      items: order.items.map(item => ({ ...item })),
    })),
  )
  const [filters, setFilters] = useState<SellerOrderFilters>({ ...emptyFilters })
  const [selectedReference, setSelectedReference] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const counts = useMemo(() => countSellerOrders(orders), [orders])
  const filtered = useMemo(() => filterSellerOrders(orders, filters), [orders, filters])
  const selected = orders.find(order => order.reference === selectedReference)

  function closeDetails() {
    setSelectedReference(null)
    const button = selectedReference ? document.getElementById('view-' + selectedReference) : null
    if (button) button.focus()
    else heading.current?.focus()
  }

  function changeStatus(status: OrderStatus) {
    if (!selectedReference) return
    // Validate the transition against the latest state, including rapid repeated clicks.
    setOrders(previous => updateDemoOrderStatus(previous, selectedReference, status))
    setNotice(
      'Demo status selection applied only when permitted by the current state. Changes exist on this page only and reset after refresh or leaving. Nothing was processed, sent, paid, or deducted. Filters remain active.',
    )
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-8 sm:py-12">
        <div className="page-width">
          <p className="mb-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>SAMPLE / DEMONSTRATION ONLY.</strong> This public preview has no signed-in
            farmer. Orders and buyer names are fictional; no real customer contact information is
            present. One future account supports both buying and selling.
          </p>
          <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
            <SellerSidebar />
            <div className="min-w-0 space-y-6">
              <header>
                <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold text-emerald-950">
                  Seller Orders
                </h1>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  Explore sample orders for one fictional farm. Only that seller's line items are
                  included, even when a marketplace purchase might involve multiple sellers.
                  Dashboard figures remain seeded examples.
                </p>
              </header>
              <section
                aria-label="Demonstration order statistics"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <StatCard
                  label="Total Orders"
                  value={counts.total}
                  explanation={`All sample records, including ${counts.Cancelled} cancelled.`}
                  icon={ClipboardList}
                />
                <StatCard
                  label="Pending Orders"
                  value={counts.Pending}
                  explanation="Pending in current page state."
                  icon={Clock}
                />
                <StatCard
                  label="Confirmed Orders"
                  value={counts.Confirmed}
                  explanation="Confirmed in current page state."
                  icon={CircleCheck}
                />
                <StatCard
                  label="Completed Orders"
                  value={counts.Completed}
                  explanation="Completed examples, not real sales."
                  icon={PackageCheck}
                />
              </section>
              <p role="status" className="text-sm leading-6 text-emerald-900">
                {notice}
              </p>
              {selected && (
                <OrderDetails
                  key={selected.reference}
                  order={selected}
                  onClose={closeDetails}
                  onStatusChange={changeStatus}
                />
              )}
              <OrderFilters
                filters={filters}
                onChange={changes => setFilters(previous => ({ ...previous, ...changes }))}
                onClear={() => setFilters({ ...emptyFilters })}
              />
              <p role="status" className="text-sm text-stone-600">
                {filtered.length} of {orders.length} demonstration orders shown. Statistics cover
                all current page orders.
              </p>
              <OrderTable
                orders={filtered}
                onView={reference => {
                  setSelectedReference(reference)
                  setNotice('')
                }}
                onClear={() => setFilters({ ...emptyFilters })}
              />
              <p className="text-xs leading-6 text-stone-500">
                Frontend filtering is not authorization. Future Express APIs must verify farmer
                identity, order ownership, and permitted status transitions. No backend integration
                is present.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
