import type { LucideIcon } from 'lucide-react'

export default function StatCard({ label, value, explanation, icon: Icon }: { label: string; value: string | number; explanation: string; icon: LucideIcon }) {
  return (
    <article className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3"><h2 className="text-sm font-medium text-stone-600">{label}</h2><Icon aria-hidden="true" className="size-5 shrink-0 text-emerald-700" /></div>
      <p className="mt-4 break-words text-3xl font-bold text-emerald-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-stone-500">{explanation}</p>
    </article>
  )
}
