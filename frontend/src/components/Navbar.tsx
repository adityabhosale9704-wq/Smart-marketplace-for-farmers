import { useCart } from '../hooks/useCart'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Menu, ShoppingBasket, X } from 'lucide-react'
import Brand from './Brand'

export default function Navbar() {
  const { totalItemCount } = useCart()
  const [open, setOpen] = useState(false)
  return <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:p-3">Skip to content</a>
    <div className="page-width flex min-h-22 flex-wrap items-center justify-between gap-2 sm:gap-5">
      <Brand />
      <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-semibold lg:flex">
        <NavLink to="/" end className={({ isActive }) => isActive ? "text-emerald-700" : ""}>Home</NavLink>
        <NavLink to="/marketplace" className={({ isActive }) => isActive ? "text-emerald-700" : ""}>Marketplace</NavLink><a href="/#sell">Sell Products</a><a href="/#about">About</a>
      </nav>
      <div className="hidden items-center gap-4 lg:flex">
        <NavLink to="/login" className="text-sm font-semibold text-emerald-800">Login</NavLink>
        <NavLink to="/register" className="button-primary">Register</NavLink>

      </div>
      <NavLink to="/cart" aria-label={`Shopping cart, ${totalItemCount} selected listed units, not combined weight`} className="ml-auto flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 px-2 py-2 text-emerald-900 lg:ml-0">
        <ShoppingBasket aria-hidden="true" className="size-5" />
        <span aria-hidden="true" className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-bold text-white">{totalItemCount}</span>
        <span className="sr-only">Selected listed units</span>
      </NavLink>
      <button className="rounded-lg border border-stone-200 p-2 lg:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav id="mobile-nav" aria-label="Mobile navigation" className="page-width grid gap-4 border-t border-stone-100 py-5 lg:hidden">
      {[['Home', '/'], ['Marketplace', '/marketplace'], ['Sell Products', '/#sell'], ['About', '/#about']].map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}
      <NavLink to="/login" onClick={() => setOpen(false)}>Login</NavLink>
      <NavLink to="/register" onClick={() => setOpen(false)}>Register</NavLink>
    </nav>}
  </header>
}
