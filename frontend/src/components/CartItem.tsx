import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import type { CartLine } from '../types/cart'
import { useCart } from '../hooks/useCart'
import MarketplaceImage from './MarketplaceImage'
import QuantitySelector from './QuantitySelector'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function CartItem({ item }: { item: CartLine }) {
  const { updateQuantity, removeItem } = useCart()
  const { product, quantity } = item

  return (
    <article className="grid min-w-0 gap-5 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-[120px_minmax(0,1fr)]">
      <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
        <MarketplaceImage src={product.image} alt={product.name} className="h-44 rounded-xl sm:h-32" />
      </Link>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-emerald-950"><Link to={`/products/${product.id}`} className="hover:underline">{product.name}</Link></h2>
            <p className="mt-2 text-sm text-stone-600">{currency.format(product.price)} / {product.unit}</p>
            <p className="mt-1 text-xs text-stone-500">{product.availableQuantity} {product.unit} available - mock stock</p>
          </div>
          <button onClick={() => removeItem(product.id)} aria-label={`Remove ${product.name} from cart`} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-700">
            <Trash2 className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <QuantitySelector quantity={quantity} availableQuantity={product.availableQuantity} unit={product.unit} onChange={value => updateQuantity(product.id, value)} />
          <p className="text-sm text-stone-600">Item estimate <span className="mt-1 block text-lg font-bold text-emerald-800">{currency.format(quantity * product.price)}</span></p>
        </div>
      </div>
    </article>
  )
}
