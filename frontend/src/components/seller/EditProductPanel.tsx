import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  SellerListingSummary,
  SellerProductEditErrors,
  SellerProductEditValues,
} from '../../types/seller'
import {
  sellerEditValues,
  sellerProductStatuses,
  validateSellerEdit,
} from '../../utils/sellerProductUtils'
import { MAX_PRODUCT_AMOUNT } from '../../utils/productValidation'

export default function EditProductPanel({
  listing,
  onApply,
  onCancel,
}: {
  listing: SellerListingSummary
  onApply: (values: SellerProductEditValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(() => sellerEditValues(listing))
  const [errors, setErrors] = useState<SellerProductEditErrors>({})
  const heading = useRef<HTMLHeadingElement>(null)
  const id = useId()
  useEffect(() => {
    heading.current?.focus()
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [])

  function change(field: keyof SellerProductEditValues, value: string) {
    setValues(previous => ({ ...previous, [field]: value }))
    setErrors(previous => {
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validateSellerEdit(values)
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    onApply(values)
  }

  const inputClass =
    'mt-2 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm'
  return (
    <section
      aria-labelledby={id + '-title'}
      className="rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
    >
      <h2
        id={id + '-title'}
        ref={heading}
        tabIndex={-1}
        className="text-xl font-bold text-emerald-950"
      >
        Edit demonstration listing
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Unit stays {listing.unit}. Changes apply on My Products only; no product is saved,
        published, or added to Marketplace.
      </p>
      <form noValidate onSubmit={submit} className="mt-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {(
            [
              { key: 'name', label: 'Product name', type: 'text' },
              { key: 'price', label: `Price in INR per ${listing.unit}`, type: 'number' },
              { key: 'stock', label: `Available stock (${listing.unit})`, type: 'number' },
            ] as const
          ).map(field => (
            <label
              key={field.key}
              htmlFor={id + '-' + field.key}
              className="min-w-0 text-sm font-semibold"
            >
              {field.label} *
              <input
                id={id + '-' + field.key}
                name={field.key}
                type={field.type}
                required
                value={values[field.key]}
                onChange={event => change(field.key, event.target.value)}
                maxLength={field.key === 'name' ? 100 : undefined}
                min={field.type === 'number' ? (field.key === 'price' ? '0.01' : '0') : undefined}
                max={field.type === 'number' ? MAX_PRODUCT_AMOUNT : undefined}
                step={field.type === 'number' ? '0.01' : undefined}
                aria-invalid={!!errors[field.key]}
                aria-describedby={errors[field.key] ? id + '-' + field.key + '-error' : undefined}
                className={inputClass}
              />
              {errors[field.key] && (
                <span
                  id={id + '-' + field.key + '-error'}
                  className="mt-2 block text-sm font-normal text-red-700"
                >
                  {errors[field.key]}
                </span>
              )}
            </label>
          ))}
          <label htmlFor={id + '-status'} className="min-w-0 text-sm font-semibold">
            Demonstration listing status *
            <select
              id={id + '-status'}
              name="status"
              value={values.status}
              onChange={event => change('status', event.target.value)}
              aria-invalid={!!errors.status}
              aria-describedby={errors.status ? id + '-status-error' : id + '-status-help'}
              className={inputClass}
            >
              {sellerProductStatuses.map(status => (
                <option key={status}>{status}</option>
              ))}
            </select>
            {errors.status && (
              <span
                id={id + '-status-error'}
                className="mt-2 block text-sm font-normal text-red-700"
              >
                {errors.status}
              </span>
            )}
          </label>
        </div>
        <p id={id + '-status-help'} className="mt-4 text-xs leading-6 text-stone-500">
          Active requires positive stock; Out of Stock requires zero stock. Draft permits either.
          Status changes are visual demonstrations only.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className="button-primary">
            Apply Demo Changes
          </button>
          <button type="button" onClick={onCancel} className="button-secondary">
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
