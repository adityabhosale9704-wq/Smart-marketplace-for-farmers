import { MapPin, UserRound } from 'lucide-react'

export default function SellerInfo({ name, location }: { name: string; location: string }) {
  return (
    <section
      aria-labelledby="seller-title"
      className="rounded-xl border border-stone-200 bg-stone-50 p-5"
    >
      <h2 id="seller-title" className="font-semibold text-emerald-950">
        Seller information
      </h2>
      <p className="mt-3 flex items-center gap-2 text-sm">
        <UserRound className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
        {name}
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
        <MapPin className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
        {location}
      </p>
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Demonstration seller information. No contact or seller verification is available.
      </p>
    </section>
  )
}
