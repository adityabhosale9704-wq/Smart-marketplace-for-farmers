import { useState } from 'react'
import { Sprout } from 'lucide-react'

export default function MarketplaceImage({ src, alt, className = '', eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  return <div className={`overflow-hidden bg-emerald-50 ${className}`}>
    {failed ? <div role="img" aria-label={alt} className="flex h-full min-h-40 flex-col items-center justify-center gap-2 p-5 text-center text-emerald-800"><Sprout aria-hidden="true" className="size-10" /><span className="text-sm">{alt}</span></div> : <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} className="h-full w-full object-cover" onError={() => setFailed(true)} />}
  </div>
}
