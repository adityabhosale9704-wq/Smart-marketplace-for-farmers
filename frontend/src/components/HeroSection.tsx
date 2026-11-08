import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Search, Sprout, Users } from 'lucide-react'
import MarketplaceImage from './MarketplaceImage'

export default function HeroSection({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (value: string) => void
}) {
  return (
    <section className="relative overflow-hidden bg-[#f2f6ee]">
      <div className="page-width grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-800">
            <Sprout className="size-4" aria-hidden="true" /> ROOTED IN TRUST. GROWN TOGETHER.
          </span>
          <h1 className="mt-6 max-w-xl text-4xl leading-tight font-bold tracking-tight text-emerald-950 sm:text-5xl lg:text-6xl">
            Fresh From the Farm,
            <br />
            <span className="text-emerald-700">Direct to You</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
            Good produce. Real connections. Discover agricultural products from Indian farmers and
            bring your own harvest to a wider community.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="button-primary" to="/marketplace">
              Explore Products <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a className="button-secondary" href="#sell">
              Start Selling
            </a>
          </div>
          <form
            action="#products"
            className="mt-8 flex rounded-xl border border-stone-200 bg-white p-1.5 shadow-sm"
            role="search"
            onSubmit={event => {
              event.preventDefault()
              document.getElementById('products')?.scrollIntoView({ behavior: 'instant' })
            }}
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 pl-3">
              <Search className="size-5 shrink-0 text-stone-400" aria-hidden="true" />
              <span className="sr-only">Search demonstration products</span>
              <input
                type="search"
                value={query}
                onChange={event => onQueryChange(event.target.value)}
                placeholder="Try tomatoes, rice, or a location..."
                className="min-w-0 w-full py-2 text-sm"
              />
            </label>
            <button className="button-primary px-4" type="submit">
              Search
            </button>
          </form>
          <p className="mt-2 text-xs text-stone-500">
            Search the sample listings below. No live inventory.
          </p>
          <div className="mt-7 flex flex-wrap gap-5 text-xs font-medium text-stone-600">
            <span className="flex items-center gap-2">
              <Leaf className="size-4 text-emerald-700" aria-hidden="true" /> Farm-to-community
            </span>
            <span className="flex items-center gap-2">
              <Users className="size-4 text-emerald-700" aria-hidden="true" /> Built for buyers &
              growers
            </span>
          </div>
        </div>
        <div className="relative pb-5 pl-0 sm:pl-5">
          <MarketplaceImage
            eager
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85"
            alt="Green agricultural fields in warm morning light"
            className="h-80 rounded-[2rem] sm:h-110 lg:h-130"
          />
          <div className="absolute right-4 bottom-0 left-4 flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-lg sm:right-auto sm:left-0 sm:max-w-80">
            <span className="rounded-full bg-emerald-100 p-3 text-emerald-800">
              <Sprout aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-emerald-950">A better way to grow</p>
              <p className="mt-1 text-sm text-stone-500">Connecting farms and communities.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
