import { Link } from 'react-router-dom'
import type { ProductNavigationState } from '../types/productNavigation'
import { MapPin, UserRound } from 'lucide-react'
import type { Product } from '../types/product'
import MarketplaceImage from './MarketplaceImage'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function ProductCard({ product, navigationState }: { product: Product; navigationState?: ProductNavigationState }) {
  return <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
    <div className="relative"><Link to={`/products/${product.id}`} state={navigationState} aria-label={`View ${product.name} details`} className="block"><MarketplaceImage src={product.image} alt={product.name} className="h-48 sm:h-52" /></Link><span className="pointer-events-none absolute top-3 left-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-800 capitalize">{product.category}</span></div>
    <div className="p-5">
      <h3 className="text-lg font-bold tracking-tight text-stone-900"><Link to={`/products/${product.id}`} state={navigationState} className="hover:text-emerald-700 hover:underline">{product.name}<span className="sr-only"> - View product details</span></Link></h3>
      <p className="mt-2 text-xl font-bold text-emerald-800">{currency.format(product.price)}<span className="text-sm font-normal text-stone-500"> / {product.unit}</span></p>
      <p className="mt-1 text-xs text-stone-500">{product.availableQuantity} {product.unit} available - sample stock</p>
      <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600"><p className="flex items-center gap-2"><UserRound className="size-3.5 shrink-0" aria-hidden="true" />{product.seller}</p><p className="flex items-center gap-2"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{product.location}</p></div>
    </div>
  </article>
}
