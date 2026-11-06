import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export default function OrderSummary() {
  const { cartItems, estimatedSubtotal } = useCart()
  const sellers = [...new Set(cartItems.map(item => item.product.seller))]
  return (
    <aside aria-labelledby="checkout-summary-title" className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 id="checkout-summary-title" className="text-xl font-bold text-emerald-950">Order review</h2>
      <p className="mt-3 text-sm text-stone-600">Current cart selections - no order has been placed.</p>
      {sellers.map(seller => (
        <section key={seller} className="mt-5 border-t border-stone-200 pt-4">
          <h3 className="text-sm font-semibold">Demo seller: {seller}</h3>
          <ul className="mt-3 space-y-4">
            {cartItems.filter(item => item.product.seller === seller).map(({ product, quantity }) => (
              <li key={product.id} className="text-sm">
                <Link to={`/products/${product.id}`} className="font-semibold text-emerald-900 hover:underline">{product.name}</Link>
                <p className="mt-1 text-stone-600">{currency.format(product.price)} per {product.unit}</p>
                <p className="mt-1 flex flex-wrap justify-between gap-2 text-stone-600"><span>{quantity} {product.unit}</span><span className="font-semibold">{currency.format(quantity * product.price)}</span></p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="mt-6 border-t border-stone-200 pt-5">
        <p className="text-sm font-semibold">Estimated product subtotal</p>
        <p aria-live="polite" className="mt-2 break-words text-3xl font-bold text-emerald-800">{currency.format(estimatedSubtotal)}</p>
        <p className="mt-4 text-xs leading-6 text-stone-600">Products may use different units (kg and quintal). Quantities are not a combined weight. Delivery charges, taxes, and additional fees have not been calculated. This is not a final payable amount.</p>
        <p className="mt-3 text-xs leading-6 text-stone-600">Products may come from different farmers. Delivery arrangements have not been confirmed; no shared shipment is assumed.</p>
        <Link to="/cart" className="mt-5 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4">Edit Cart</Link>
      </div>
    </aside>
  )
}
