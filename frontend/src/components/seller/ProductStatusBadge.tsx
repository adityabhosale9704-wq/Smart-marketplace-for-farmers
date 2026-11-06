import type { SellerListingSummary } from '../../types/seller'
import { sellerProductStatus } from '../../utils/sellerProductUtils'

export default function ProductStatusBadge({ listing }: { listing: SellerListingSummary }) {
  const status = sellerProductStatus(listing)
  const colors = status === 'Active' ? 'bg-emerald-50 text-emerald-800' : status === 'Draft' ? 'bg-stone-100 text-stone-600' : 'bg-red-50 text-red-800'
  return <span className={`inline-block h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ${colors}`}>{status}</span>
}
