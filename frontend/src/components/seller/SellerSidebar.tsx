import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, PackagePlus, Package, ClipboardList, ArrowLeft } from 'lucide-react'

export default function SellerSidebar() {
  return (
    <aside className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 lg:sticky lg:top-28">
      <details open className="group">
        <summary className="cursor-pointer text-sm font-bold text-emerald-950">Seller preview navigation</summary>
        <nav aria-label="Seller preview" className="mt-5 space-y-2">
          <NavLink to="/seller/dashboard" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? 'bg-emerald-50 text-emerald-900' : 'text-stone-600'}`}><LayoutDashboard className="size-5 shrink-0" aria-hidden="true" />Dashboard</NavLink>
          <NavLink to="/seller/add-product" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? 'bg-emerald-50 text-emerald-900' : 'text-stone-600'}`}><PackagePlus className="size-5 shrink-0" aria-hidden="true" />Add Product</NavLink>
          <NavLink to="/seller/products" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? 'bg-emerald-50 text-emerald-900' : 'text-stone-600'}`}><Package className="size-5 shrink-0" aria-hidden="true" />My Products</NavLink>
          {[{ label: 'Seller Orders', icon: ClipboardList }].map(item => (
            <button key={item.label} disabled className="flex w-full cursor-not-allowed flex-wrap items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-stone-500">
              <item.icon className="size-5 shrink-0" aria-hidden="true" /><span>{item.label}</span><span className="rounded bg-stone-100 px-2 py-1 text-[10px]">Coming Soon</span>
            </button>
          ))}
          <Link to="/marketplace" className="flex items-center gap-3 border-t border-stone-100 px-3 pt-5 pb-3 text-sm font-semibold text-emerald-800"><ArrowLeft className="size-5 shrink-0" aria-hidden="true" />Back to Marketplace</Link>
        </nav>
      </details>
      <p className="mt-4 border-t border-stone-100 pt-4 text-xs leading-6 text-stone-500">Public demonstration. No farmer is signed in. One future account will support buying and selling.</p>
    </aside>
  )
}
