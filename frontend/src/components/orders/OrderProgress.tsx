import type { SellerFulfillmentStatus } from '../../types/buyerOrder'

export default function OrderProgress({ status, sellerName }: { status: SellerFulfillmentStatus; sellerName: string }) {
  const steps: SellerFulfillmentStatus[] = ['Pending', 'Confirmed', 'Completed']
  if (status === 'Cancelled') return <p className="mt-4 rounded-lg bg-stone-100 p-3 text-xs leading-6 text-stone-700">Example status for {sellerName}: Cancelled. This is not successful completion; no delivery progress is inferred.</p>
  const current = steps.indexOf(status)
  return (
    <div className="mt-4">
      <p className="text-xs text-stone-500">Illustrative status path for {sellerName}; no actual events or tracking.</p>
      <ol aria-label={`Example progress for ${sellerName}`} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {steps.map((step, index) => <li key={step} aria-current={index === current ? 'step' : undefined}
          className={`rounded-lg border p-2 text-center text-xs ${index === current ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-900' : 'border-stone-200 text-stone-500'}`}>
          {step}<span className="mt-1 block text-[10px]">{index === current ? 'Current example' : 'Path step only'}</span>
        </li>)}
      </ol>
    </div>
  )
}
