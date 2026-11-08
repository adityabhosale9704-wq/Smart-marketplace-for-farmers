import { useId } from 'react'

interface AuthInputProps {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: 'text' | 'email' | 'tel'
  autoComplete?: string
  maxLength?: number
}

export default function AuthInput({
  name,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  maxLength,
}: AuthInputProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        maxLength={maxLength}
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 w-full min-w-0 rounded-lg border px-3 py-3 text-sm ${error ? 'border-red-500' : 'border-stone-300'}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
