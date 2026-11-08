import { Link } from 'react-router-dom'
import { ShoppingBasket, Tractor, ArrowRight } from 'lucide-react'

const sections = [
  {
    title: 'Buying',
    icon: ShoppingBasket,
    links: [
      { label: 'Browse Marketplace', to: '/marketplace' },
      { label: 'Shopping Cart', to: '/cart' },
      { label: 'My Orders', to: '/my-orders' },
    ],
  },
  {
    title: 'Selling',
    icon: Tractor,
    links: [
      { label: 'Seller Dashboard', to: '/seller/dashboard' },
      { label: 'Add Product', to: '/seller/add-product' },
      { label: 'My Products', to: '/seller/products' },
      { label: 'Seller Orders', to: '/seller/orders' },
    ],
  },
]

export default function AccountNavigation() {
  return (
    <section aria-labelledby="account-navigation-title">
      <h2 id="account-navigation-title" className="text-xl font-bold text-emerald-950">
        One account, both possibilities
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Explore buying and selling previews. No role selection, separate accounts, or authenticated
        access is created.
      </p>
      <div className="mt-5 grid items-start gap-5 sm:grid-cols-2">
        {sections.map(section => (
          <nav
            key={section.title}
            aria-label={section.title + ' account navigation'}
            className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5"
          >
            <h3 className="flex items-center gap-3 font-bold text-emerald-950">
              <section.icon aria-hidden="true" className="size-5 text-emerald-700" />
              {section.title}
            </h3>
            <ul className="mt-4 space-y-1">
              {section.links.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex items-center justify-between gap-3 rounded-lg py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    <span>{link.label}</span>
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </section>
  )
}
