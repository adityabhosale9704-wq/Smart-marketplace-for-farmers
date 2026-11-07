import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBasket } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DeliveryForm from '../components/checkout/DeliveryForm'
import OrderSummary from '../components/checkout/OrderSummary'
import { useCart } from '../hooks/useCart'
import { emptyDeliveryDetails } from '../types/checkout'
import type { DeliveryDetails, DeliveryErrors } from '../types/checkout'
import { validateDeliveryDetails } from '../utils/checkoutValidation'

export default function Checkout() {
  const { cartItems } = useCart()
  const [details, setDetails] = useState<DeliveryDetails>({ ...emptyDeliveryDetails })
  const [errors, setErrors] = useState<DeliveryErrors>({})
  const [reviewing, setReviewing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  function changeField(field: keyof DeliveryDetails, value: string) {
    setDetails(previous => ({ ...previous, [field]: value }))
    setErrors(previous => {
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  function reviewDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateDeliveryDetails(details)
    setDetails(result.details)
    setErrors(result.errors)
    if (Object.keys(result.errors).length > 0) {
      const firstInvalid = Object.keys(result.errors)[0]
      event.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    setReviewing(true)
    contentRef.current?.focus()
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-[65vh] bg-stone-50 py-10 sm:py-14">
        <div className="page-width">
          <Link to="/cart" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">Back to Cart</Link>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-emerald-950">Checkout demonstration</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">Review sample purchases and delivery details. No information is submitted, no stock is reserved, and no order or payment is created.</p>
          {cartItems.length === 0 ? (
            <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-10 text-center">
              <ShoppingBasket aria-hidden="true" className="mx-auto size-12 text-emerald-700" />
              <h2 className="mt-5 text-2xl font-bold">Your cart is empty</h2>
              <p className="mt-3 text-stone-600">Add a sample product before reviewing delivery details.</p>
              <Link to="/marketplace" className="button-primary mt-6">Back to Marketplace</Link>
            </section>
          ) : (
            <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div ref={contentRef} tabIndex={-1} className="min-w-0">
                {reviewing ? (
                  <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
                    <p className="eyebrow">DEMONSTRATION REVIEW ONLY</p>
                    <h2 className="mt-3 text-2xl font-bold text-emerald-950">Review your details</h2>
                    <h3 className="mt-6 font-semibold">Contact information</h3>
                    <div className="mt-3 space-y-2 break-words text-sm text-stone-600">
                      <p>{details.fullName}</p><p>Mobile: {details.mobile}</p>
                      {details.email && <p>Email: {details.email}</p>}
                    </div>
                    <h3 className="mt-6 font-semibold">Delivery address</h3>
                    <address className="mt-3 space-y-2 break-words text-sm not-italic text-stone-600">
                      <p>{details.addressLine1}</p>{details.addressLine2 && <p>{details.addressLine2}</p>}
                      <p>{details.city}, {details.district}</p><p>{details.state} - {details.pinCode}</p>
                    </address>
                    {details.notes && <div className="mt-6"><h3 className="font-semibold">Delivery notes</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-600">{details.notes}</p></div>}
                    <button onClick={() => { setReviewing(false); contentRef.current?.focus() }} className="button-secondary mt-6">Edit Details</button>
                    <p className="mt-7 rounded-lg bg-emerald-50 p-4 font-semibold text-emerald-900">Order Placement Coming Soon</p>
                    <p className="mt-3 text-xs leading-6 text-stone-500">Nothing has been ordered. Details remain temporarily on this page and are discarded when it is reloaded or you leave checkout. Use sample information.</p>
                  </section>
                ) : <DeliveryForm details={details} errors={errors} onChange={changeField} onReview={reviewDetails} />}
              </div>
              <OrderSummary />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
