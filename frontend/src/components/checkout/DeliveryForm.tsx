import { useId } from 'react'
import type { FormEvent } from 'react'
import type { DeliveryDetails, DeliveryErrors } from '../../types/checkout'
import { fieldLimits } from '../../utils/checkoutValidation'

interface DeliveryFormProps {
  details: DeliveryDetails
  errors: DeliveryErrors
  onChange: (field: keyof DeliveryDetails, value: string) => void
  onReview: (event: FormEvent<HTMLFormElement>) => void
}

const fields: {
  name: keyof DeliveryDetails
  label: string
  required?: boolean
  type?: string
  autoComplete?: string
  inputMode?: 'numeric' | 'tel' | 'email'
  wide?: boolean
}[] = [
  { name: 'fullName', label: 'Full Name', required: true, autoComplete: 'name', wide: true },
  { name: 'mobile', label: 'Mobile Number', required: true, type: 'tel', autoComplete: 'tel-national', inputMode: 'tel' },
  { name: 'email', label: 'Email (optional)', type: 'email', autoComplete: 'email', inputMode: 'email' },
  { name: 'addressLine1', label: 'Address Line 1', required: true, autoComplete: 'address-line1', wide: true },
  { name: 'addressLine2', label: 'Address Line 2 (optional)', autoComplete: 'address-line2', wide: true },
  { name: 'city', label: 'Village / City', required: true, autoComplete: 'address-level2' },
  { name: 'district', label: 'District', required: true },
  { name: 'state', label: 'State', required: true, autoComplete: 'address-level1' },
  { name: 'pinCode', label: 'PIN Code', required: true, autoComplete: 'postal-code', inputMode: 'numeric' },
]

export default function DeliveryForm({ details, errors, onChange, onReview }: DeliveryFormProps) {
  const prefix = useId()
  return (
    <form noValidate onSubmit={onReview} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-bold text-emerald-950">Contact & delivery details</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">Use sample details for this demonstration. Required fields are marked *. Nothing is sent or saved by this app.</p>
      {Object.values(errors).some(Boolean) && <div role="alert" tabIndex={-1} id="checkout-errors" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Please correct the highlighted fields before reviewing your details.</div>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {fields.map(field => {
          const id = `${prefix}-${field.name}`
          const error = errors[field.name]
          return (
            <div key={field.name} className={`min-w-0 ${field.wide ? 'sm:col-span-2' : ''}`}>
              <label htmlFor={id} className="text-sm font-semibold">{field.label}{field.required ? ' *' : ''}</label>
              <input id={id} name={field.name} type={field.type ?? 'text'} required={field.required}
                autoComplete={field.autoComplete} inputMode={field.inputMode} maxLength={fieldLimits[field.name]}
                value={details[field.name]} onChange={event => onChange(field.name, event.target.value)}
                aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
                className={`mt-2 w-full min-w-0 rounded-lg border bg-white px-3 py-3 text-sm ${error ? 'border-red-500' : 'border-stone-300'}`} />
              {error && <p id={`${id}-error`} className="mt-2 text-sm text-red-700">{error}</p>}
            </div>
          )
        })}
        <div className="sm:col-span-2">
          <label htmlFor={`${prefix}-notes`} className="text-sm font-semibold">Delivery Notes (optional)</label>
          <textarea id={`${prefix}-notes`} name="notes" rows={3} maxLength={fieldLimits.notes} value={details.notes}
            onChange={event => onChange('notes', event.target.value)} aria-invalid={!!errors.notes}
            aria-describedby={errors.notes ? `${prefix}-notes-error` : undefined}
            className="mt-2 w-full rounded-lg border border-stone-300 p-3 text-sm" />
          {errors.notes && <p id={`${prefix}-notes-error`} className="mt-2 text-sm text-red-700">{errors.notes}</p>}
        </div>
      </div>
      <p className="mt-5 text-xs leading-6 text-stone-500">PIN validation checks format only. It does not confirm that an address exists or is deliverable.</p>
      <button type="submit" className="button-primary mt-5 w-full sm:w-auto">Review Details</button>
    </form>
  )
}
