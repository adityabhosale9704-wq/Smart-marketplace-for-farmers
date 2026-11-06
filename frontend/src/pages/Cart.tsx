import { Link } from 'react-router-dom'
import { ShoppingBasket } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartItem from '../components/CartItem'
import { useCart } from '../hooks/useCart'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function Cart() {
  const { cartItems, totalItemCount, estimatedSubtotal, clearCart, message, storageWarning } = useCart()
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-[65vh] bg-stone-50 py-10 sm:py-14">
        <div className="page-width">
          <h1 className="text-3xl font-bold text-emerald-950">Shopping Cart</h1>
          <p className="mt-3 text-sm text-stone-600">{cartItems.length} product selections - {totalItemCount} selected listed units. Counts may mix kg and quintal units and are not a combined weight.</p>
          <p className="mt-3 text-sm text-stone-500">Demonstration cart only. Selections do not reserve real stock.</p>
          <p role="status" className="mt-3 text-sm font-medium text-emerald-800">{message}</p>
          {storageWarning && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Browser storage is unavailable. Your cart works in this tab but may not survive refresh or navigation that reloads the page.</p>}
          {cartItems.length === 0 ? (
            <section className="mt-8 rounded-2xl border border-stone-200 bg-white px-5 py-16 text-center">
              <ShoppingBasket className="mx-auto size-14 text-emerald-600" aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-bold">Your cart is empty</h2>
              <p className="mt-3 text-stone-600">Explore the sample harvest and choose something for your cart.</p>
              <Link to="/marketplace" className="button-primary mt-6">Browse Marketplace</Link>
            </section>
          ) : (
            <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section aria-label="Cart products" className="min-w-0 space-y-4">
                {cartItems.map(item => <CartItem key={item.productId} item={item} />)}
                <div className="flex flex-wrap justify-between gap-4 py-3">
                  <Link to="/marketplace" className="font-semibold text-emerald-800 underline underline-offset-4">Continue Shopping</Link>
                  <button onClick={clearCart} className="text-sm font-semibold text-red-700 underline underline-offset-4">Clear Cart</button>
                </div>
              </section>
              <aside aria-labelledby="summary-title" className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 id="summary-title" className="text-xl font-bold text-emerald-950">Cart summary</h2>
                <p className="mt-5 text-sm text-stone-600">Estimated product subtotal</p>
                <p className="mt-2 text-3xl font-bold text-emerald-800">{currency.format(estimatedSubtotal)}</p>
                <p className="mt-4 text-xs leading-6 text-stone-600">Calculated from each selected quantity and its listed unit price. Taxes, delivery charges, and other fees are not included.</p>
                <Link to="/checkout" className="button-primary mt-6 w-full">Continue to Checkout</Link>
                <p className="mt-3 text-xs leading-5 text-stone-500">No orders or payments can be placed.</p>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
