import type { OrderStatus } from '../../types/seller'

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    Pending: 'bg-amber-50 text-amber-900',
    Confirmed: 'bg-sky-50 text-sky-900',
    Completed: 'bg-emerald-50 text-emerald-900',
    Cancelled: 'bg-stone-100 text-stone-700',
  }
  return (
    <span
      className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}
    >
      Example: {status}
    </span>
  )
}
