import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Carrot, Cherry, Wheat, Bean, Sprout, Flame, Search, Handshake, Tractor } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HeroSection from '../components/HeroSection'
import CategoryCard from '../components/CategoryCard'
import type { Category } from '../components/CategoryCard'
import ProductCard from '../components/ProductCard'
import { mockProducts } from '../data/mockProducts'

const categories: Category[] = [
  { id: 'vegetables', name: 'Vegetables', icon: Carrot },
  { id: 'fruits', name: 'Fruits', icon: Cherry },
  { id: 'grains', name: 'Grains', icon: Wheat },
  { id: 'pulses', name: 'Pulses', icon: Bean },
  { id: 'seeds', name: 'Seeds', icon: Sprout },
  { id: 'spices', name: 'Spices', icon: Flame },
]
const steps = [
  { title: 'Browse Products', icon: Search, copy: 'Explore agricultural products by category and discover growers in your region.' },
  { title: 'Connect and Order', icon: Handshake, copy: 'In a future release, connect with sellers to discuss produce and arrange orders.' },
  { title: 'Sell Your Produce', icon: Tractor, copy: 'Your future farmer account will let you buy and sell. List your harvest from the same account.' },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const products = mockProducts.filter(product => {
    const searchText = `${product.name} ${product.category} ${product.location} ${product.seller}`.toLowerCase()
    return searchText.includes(query.trim().toLowerCase())
  })
  return <>
    <Navbar />
    <main id="main-content">
      <HeroSection query={query} onQueryChange={setQuery} />
      <section id="categories" className="page-width py-14 sm:py-18" aria-labelledby="categories-title">
        <p className="eyebrow">SOMETHING FOR EVERY NEED</p><h2 id="categories-title" className="section-title">Explore by category</h2><p className="mt-3 text-stone-500">From everyday essentials to your next harvest.</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categories.map(item => <CategoryCard key={item.id} category={item} />)}</div>
      </section>
      <section id="products" className="border-y border-stone-100 bg-stone-50 py-14 sm:py-18" aria-labelledby="products-title">
        <div className="page-width">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">DISCOVER THE HARVEST</p><h2 id="products-title" className="section-title">Fresh picks from our farms</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">Demonstration listings only. Prices, sellers, locations, and stock are illustrative; purchases are not available.</p></div><Link to="/marketplace" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">View all products <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          <p role="status" className="mt-6 text-sm text-stone-500">{products.length} sample products{query.trim() ? ` matching "${query.trim()}"` : ''}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
          {products.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center"><h3 className="font-semibold">No sample products found</h3><p className="mt-2 text-sm text-stone-500">Try another search or explore all products in the marketplace.</p></div>}
        </div>
      </section>
      <section id="about" className="page-width py-16 sm:py-20" aria-labelledby="steps-title">
        <div className="text-center"><p className="eyebrow">SIMPLE CONNECTIONS. SHARED GROWTH.</p><h2 id="steps-title" className="section-title">A marketplace made for you</h2><p className="mt-3 text-stone-500">One community. One future account for buying and selling.</p></div>
        <div className="mt-12 grid gap-10 md:grid-cols-3">{steps.map((step, index) => <article key={step.title} className="text-center"><div className="relative mx-auto flex size-18 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><step.icon aria-hidden="true" className="size-8" /><span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-white">{index + 1}</span></div><h3 className="mt-6 text-lg font-bold">{step.title}</h3><p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-stone-500">{step.copy}</p></article>)}</div>
      </section>
      <section id="sell" className="page-width pb-16" aria-labelledby="sell-title"><div className="relative overflow-hidden rounded-3xl bg-emerald-900 px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12"><div className="max-w-xl"><p className="text-xs font-semibold tracking-widest text-emerald-200">YOUR HARD WORK. NEW POSSIBILITIES.</p><h2 id="sell-title" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Grow your reach.<br />Share your harvest.</h2><p className="mt-5 text-sm leading-7 text-emerald-100">Bring your produce to a community of buyers. When seller tools launch, your farmer account will let you list products and shop in one place.</p></div><div className="mt-7 shrink-0 lg:mt-0"><button disabled className="flex cursor-not-allowed items-center gap-3 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-900">Start Selling <ArrowRight aria-hidden="true" className="size-4" /></button><p className="mt-3 text-xs text-emerald-200">Seller registration coming soon</p></div></div></section>
    </main>
    <Footer />
  </>
}
