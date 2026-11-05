import { Sprout } from 'lucide-react'

export default function Brand({ light = false }: { light?: boolean }) {
  return <a href="/" aria-label="FarmMarket home" className={`inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-emerald-950'}`}><span className="rounded-xl bg-emerald-700 p-2 text-white"><Sprout aria-hidden="true" className="size-6" /></span>Farm<span className="-ml-2 text-emerald-600">Market</span></a>
}
