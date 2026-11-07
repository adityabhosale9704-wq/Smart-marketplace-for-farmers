import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardList, Clock, CircleCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StatCard from '../components/seller/StatCard'
import BuyerOrderCard from '../components/orders/BuyerOrderCard'
import BuyerOrderDetails from '../components/orders/BuyerOrderDetails'
import BuyerOrderFilters from '../components/orders/BuyerOrderFilters'
import { mockBuyerOrders } from '../data/mockBuyerOrders'
import type { BuyerOrderFilters as Filters } from '../types/buyerOrder'
import { buyerOrderCounts, filterBuyerOrders } from '../utils/buyerOrderUtils'

const emptyFilters: Filters = { search: '', status: '' }

export default function MyOrders() {
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters })
  const [params, setParams] = useSearchParams()
  const heading = useRef<HTMLHeadingElement>(null)
  const hasReference = params.has('order')
  const reference = params.get('order')
  const selected = mockBuyerOrders.find(order => order.reference === reference)
  const counts = useMemo(() => buyerOrderCounts(mockBuyerOrders), [])
  const filtered = useMemo(() => filterBuyerOrders(mockBuyerOrders, filters), [filters])

  function closeDetails() {
    const next = new URLSearchParams(params)
    next.delete('order')
    setParams(next)
    const button = reference ? document.getElementById('buyer-view-' + reference) : null
    if (button) button.focus()
    else heading.current?.focus()
  }

  function viewDetails(orderReference: string) {
    const next = new URLSearchParams(params)
    next.set('order', orderReference)
    setParams(next)
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-stone-50 py-10 sm:py-14">
        <div className="page-width space-y-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Public demonstration preview - no login required.</strong> All orders, sellers, and locations below are fictional. These records are unrelated to the Checkout demo and do not represent purchases or a signed-in buyer.</p>
          <header className="flex flex-wrap items-start justify-between gap-5"><div><h1 ref={heading} tabIndex={-1} className="text-3xl font-bold text-emerald-950">My Orders</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Explore a sample buyer history. One future farmer account supports both buying and selling, with separate buyer and seller order views.</p></div><Link to="/marketplace" className="button-secondary">Browse Marketplace</Link></header>
          <section aria-label="Demonstration purchase statistics" className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Orders" value={counts.total} explanation="All fictional sample purchases." icon={ClipboardList} />
            <StatCard label="In Progress Orders" value={counts.inProgress} explanation="At least one seller is Pending or Confirmed." icon={Clock} />
            <StatCard label="Completed Orders" value={counts.completed} explanation="Every seller is Completed. No real delivery is asserted." icon={CircleCheck} />
          </section>
          {hasReference && <BuyerOrderDetails key={reference ?? ''} order={selected} onClose={closeDetails} />}
          <BuyerOrderFilters filters={filters} onChange={changes => setFilters(previous => ({ ...previous, ...changes }))} onClear={() => setFilters({ ...emptyFilters })} />
          <p role="status" className="text-sm text-stone-600">{filtered.length} of {mockBuyerOrders.length} demonstration purchases shown. Statistics cover all samples, including cancelled and mixed-status purchases.</p>
          {filtered.length ? <div className="grid items-start gap-5 lg:grid-cols-2">{filtered.map(order => <BuyerOrderCard key={order.reference} order={order} onView={() => viewDetails(order.reference)} />)}</div> : <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <h2 className="text-xl font-bold">{mockBuyerOrders.length ? 'No matching demonstration orders' : 'No demonstration orders available'}</h2>
            <p className="mt-3 text-sm text-stone-600">Try another search or status. No real buyer history is connected.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3"><button onClick={() => setFilters({ ...emptyFilters })} className="button-secondary">Clear Filters</button><Link to="/marketplace" className="button-primary">Browse Marketplace</Link></div>
          </section>}
          <p className="text-xs leading-6 text-stone-500">Frontend filtering is not authorization. Future Express endpoints must verify buyer ownership of purchases and seller ownership of relevant line items. No backend or tracking integration is present.</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
