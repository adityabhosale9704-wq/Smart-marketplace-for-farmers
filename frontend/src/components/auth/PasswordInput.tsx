import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete: 'current-password' | 'new-password'
  hint?: string
}

export default function PasswordInput({
  name,
  label,
  value,
  onChange,
  error,
  autoComplete,
  hint,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div
        className={`mt-2 flex min-w-0 rounded-lg border ${error ? 'border-red-500' : 'border-stone-300'}`}
      >
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={event => onChange(event.target.value)}
          required
          maxLength={128}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 rounded-l-lg px-3 py-3 text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible(previous => !previous)}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={id}
          className="shrink-0 rounded-r-lg px-3 text-stone-600 hover:bg-emerald-50"
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
