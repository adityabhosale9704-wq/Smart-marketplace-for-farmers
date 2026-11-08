import type { ReactNode } from 'react'
import { Sprout, ShoppingBasket, Tractor } from 'lucide-react'
import Navbar from '../Navbar'
import Footer from '../Footer'

export default function AuthLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <>
      <Navbar />
      <main id="main-content" className="bg-stone-50 py-10 sm:py-16">
        <div className="page-width grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
          <section className="rounded-3xl bg-emerald-950 p-7 text-white sm:p-10">
            <Sprout className="size-12 text-emerald-300" aria-hidden="true" />
            <p className="mt-7 text-xs font-semibold tracking-widest text-emerald-200">
              GROWING TOGETHER
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              One community.
              <br />A world of possibilities.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-emerald-100">
              FarmMarket connects agricultural buyers and growers. One future farmer account will
              support both buying and selling, without a permanent role choice.
            </p>
            <div className="mt-7 flex flex-wrap gap-5 text-sm text-emerald-100">
              <span className="flex items-center gap-2">
                <ShoppingBasket className="size-5" aria-hidden="true" />
                Discover produce
              </span>
              <span className="flex items-center gap-2">
                <Tractor className="size-5" aria-hidden="true" />
                Share your harvest
              </span>
            </div>
          </section>
          <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
            <h1 className="text-3xl font-bold tracking-tight text-emerald-950">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
            <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950">
              Demonstration UI only. Use sample information and a password you do not use elsewhere.
              Authentication is not connected. The app does not send or store these details.
            </p>
            <div className="mt-6">{children}</div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
