import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  quantity: number
  availableQuantity: number
  unit: string
  onChange: (quantity: number) => void
}

export default function QuantitySelector({
  quantity,
  availableQuantity,
  unit,
  onChange,
}: QuantitySelectorProps) {
  const labelId = useId()
  const maximum = Math.max(0, Math.floor(availableQuantity))
  const unavailable = maximum < 1

  return (
    <div>
      <p id={labelId} className="text-sm font-semibold">
        Selected quantity ({unit})
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="mt-3 inline-flex items-center rounded-lg border border-stone-300 bg-white"
      >
        <button
          type="button"
          aria-label={`Decrease quantity by 1 ${unit}`}
          disabled={unavailable || quantity <= 1}
          onClick={() => onChange(Math.max(1, quantity - 1))}
          className="rounded-l-lg p-3 text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-stone-400"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <output
          aria-live="polite"
          className="min-w-16 border-x border-stone-200 px-3 py-2 text-center font-semibold"
        >
          {unavailable ? 0 : quantity}
        </output>
        <button
          type="button"
          aria-label={`Increase quantity by 1 ${unit}`}
          disabled={unavailable || quantity >= maximum}
          onClick={() => onChange(Math.min(maximum, quantity + 1))}
          className="rounded-r-lg p-3 text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-stone-400"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {unavailable
          ? 'No stock available for selection.'
          : `Choose 1 to ${maximum} ${unit} in whole-unit steps.`}
      </p>
    </div>
  )
}
