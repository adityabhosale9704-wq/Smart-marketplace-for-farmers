import { useCart } from '../hooks/useCart'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBasket } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MarketplaceImage from '../components/MarketplaceImage'
import QuantitySelector from '../components/QuantitySelector'
import SellerInfo from '../components/SellerInfo'
import { mockProducts } from '../data/mockProducts'
import type { Product } from '../types/product'
import { readProductNavigationState } from '../services/filterProducts'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

// Keying this component by product ID resets quantity and image state for a new product.
function ProductContent({ product }: { product: Product }) {
  const maximum = Math.max(0, Math.floor(product.availableQuantity))
  const [quantity, setQuantity] = useState(maximum > 0 ? 1 : 0)
  const { addItem, cartItems, message, storageWarning } = useCart()
  const alreadySelected = cartItems.find(item => item.productId === product.id)?.quantity ?? 0
  const remaining = Math.max(0, maximum - alreadySelected)
  const subtotal = quantity * product.price

  return (
    <div className="mt-7 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <MarketplaceImage
          src={product.image}
          alt={product.name}
          eager
          className="h-80 rounded-2xl border border-stone-200 sm:h-110 lg:h-140"
        />
        <p className="mt-3 text-xs leading-5 text-stone-500">
          Illustrative photograph. Product, seller, prices, and stock are demonstration data.
        </p>
      </div>
      <div className="min-w-0">
        <Link
          to={`/marketplace?category=${product.category}`}
          className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 capitalize"
        >
          {product.category}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-5 text-3xl font-bold text-emerald-800">
          {currency.format(product.price)}
          <span className="text-base font-normal text-stone-600"> / {product.unit}</span>
        </p>
        <p className="mt-2 text-sm text-stone-600">
          {maximum > 0
            ? `${product.availableQuantity} ${product.unit} available - sample stock`
            : 'Out of stock - demonstration listing'}
        </p>
        <section aria-labelledby="description-title" className="mt-6">
          <h2 id="description-title" className="font-semibold">
            About this product
          </h2>
          <p className="mt-2 leading-7 text-stone-600">{product.description}</p>
        </section>
        <div className="mt-7 border-y border-stone-200 py-6">
          <QuantitySelector
            quantity={quantity}
            availableQuantity={product.availableQuantity}
            unit={product.unit}
            onChange={setQuantity}
          />
          <div className="mt-5 rounded-xl bg-emerald-50 p-4">
            <h2 className="text-sm font-semibold text-emerald-950">Estimated product subtotal</h2>
            <p aria-live="polite" className="mt-2 text-2xl font-bold text-emerald-800">
              {currency.format(subtotal)}
            </p>
            <p className="mt-2 text-sm text-stone-600">
              {quantity} {product.unit} &times; {currency.format(product.price)} per {product.unit}{' '}
              = {currency.format(subtotal)}
            </p>
            {product.unit === 'quintal' && (
              <p className="mt-2 text-xs text-stone-600">
                1 quintal = 100 kg. Quantity here is measured in quintals.
              </p>
            )}
            <p className="mt-2 text-xs leading-5 text-stone-600">
              Product estimate only. Delivery, taxes, and other charges are not included.
            </p>
          </div>
          <p id="cart-notice" className="mt-4 text-sm text-stone-600">
            {alreadySelected} {product.unit} already in cart. {remaining} {product.unit} can still
            be added.
          </p>
          <button
            type="button"
            disabled={remaining < 1 || quantity > remaining}
            aria-describedby="cart-notice"
            onClick={() => addItem(product.id, quantity)}
            className="button-primary mt-4 w-full disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
          >
            <ShoppingBasket className="size-5" aria-hidden="true" /> Add to Cart
          </button>
          {quantity > remaining && remaining > 0 && (
            <p className="mt-2 text-sm text-amber-800">
              Choose {remaining} {product.unit} or fewer to stay within mock stock.
            </p>
          )}
          {remaining === 0 && (
            <p className="mt-2 text-sm text-stone-600">
              No additional quantity is available for this cart.
            </p>
          )}
          <p role="status" className="mt-3 text-sm font-medium text-emerald-800">
            {message}
          </p>
          {storageWarning && (
            <p className="mt-2 text-xs text-amber-800">
              Browser storage is unavailable; cart selections may not survive refresh.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-5 text-sm font-semibold text-emerald-800">
            <Link to="/cart" className="underline underline-offset-4">
              View Cart
            </Link>
            <Link to="/marketplace" className="underline underline-offset-4">
              Continue Shopping
            </Link>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Demo cart only. Adding an item does not reserve stock or place an order.
          </p>
        </div>
        <div className="mt-6">
          <SellerInfo name={product.seller} location={product.location} />
        </div>
      </div>
    </div>
  )
}

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>()
  const location = useLocation()
  const navigation = readProductNavigationState(location.state)
  const returnTo = navigation?.returnTo ?? '/marketplace'
  const product = mockProducts.find(item => item.id === productId)

  return (
    <>
      <Navbar />
      <main id="main-content" className="page-width min-h-[60vh] py-8 sm:py-12">
        <Link
          to={returnTo}
          state={navigation}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to Marketplace
        </Link>
        {product ? (
          <ProductContent key={product.id} product={product} />
        ) : (
          <section className="my-10 rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center sm:p-14">
            <h1 className="text-3xl font-bold text-emerald-950">Product Not Found</h1>
            <p className="mx-auto mt-4 max-w-md leading-7 text-stone-600">
              This product link is missing or does not match a demonstration listing. Browse the
              Marketplace to choose another product.
            </p>
            <Link to="/marketplace" className="button-primary mt-6">
              Browse Marketplace
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
