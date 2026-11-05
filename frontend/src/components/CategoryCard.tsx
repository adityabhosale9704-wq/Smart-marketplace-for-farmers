import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import type { CategoryId } from '../types/product'

export interface Category {
  id: CategoryId
  name: string
  icon: LucideIcon
}

export default function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon
  return (
    <Link to={`/marketplace?category=${category.id}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-6 transition-colors hover:border-emerald-400 hover:bg-emerald-50">
      <span className="rounded-full bg-[#f2f6ee] p-4 text-emerald-700"><Icon className="size-7" aria-hidden="true" /></span>
      <span className="text-sm font-semibold">{category.name}</span>
    </Link>
  )
}
