import { useState } from 'react'
import { Menu, ShoppingBasket, X } from 'lucide-react'
import Brand from './Brand'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:p-3">Skip to content</a>
    <div className="page-width flex min-h-22 items-center justify-between gap-5">
      <Brand />
      <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-semibold lg:flex">
        <a href="/" aria-current="page" className="text-emerald-700">Home</a>
        <a href="#products">Marketplace</a><a href="#sell">Sell Products</a><a href="#about">About</a>
      </nav>
      <div className="hidden items-center gap-4 lg:flex">
        <button disabled className="coming-soon">Login <span className="block text-xs font-normal">Coming soon</span></button>
        <button disabled className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-500">Register <span className="block text-xs">Coming soon</span></button>
        <button disabled aria-label="Shopping cart coming soon" className="coming-soon"><ShoppingBasket aria-hidden="true" className="size-5" /><span className="text-xs">Soon</span></button>
      </div>
      <button className="rounded-lg border border-stone-200 p-2 lg:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav id="mobile-nav" aria-label="Mobile navigation" className="page-width grid gap-4 border-t border-stone-100 py-5 lg:hidden">
      {[['Home', '/'], ['Marketplace', '#products'], ['Sell Products', '#sell'], ['About', '#about']].map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}
      <p className="text-sm text-stone-500">Login, registration & shopping cart ? coming soon</p>
    </nav>}
  </header>
}
