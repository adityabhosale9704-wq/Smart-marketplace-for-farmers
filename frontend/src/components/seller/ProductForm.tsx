import { useId } from 'react'
import type { FormEvent } from 'react'
import { categoryOptions } from '../../data/categories'
import { productUnits } from '../../types/productForm'
import type {
  ProductFormErrors,
  ProductFormValues,
  ProductImageSelection,
} from '../../types/productForm'
import { MAX_PRODUCT_AMOUNT, productFieldLimits } from '../../utils/productValidation'
import ProductImageUpload from './ProductImageUpload'

interface ProductFormProps {
  values: ProductFormValues
  errors: ProductFormErrors
  image: ProductImageSelection | null
  imageBusy: boolean
  onChange: (field: keyof ProductFormValues, value: string) => void
  onImageChange: (image: ProductImageSelection | null, error?: string) => void
  onImageBusy: (busy: boolean) => void
  onPreview: (event: FormEvent<HTMLFormElement>) => void
}

export default function ProductForm({
  values,
  errors,
  image,
  imageBusy,
  onChange,
  onImageChange,
  onImageBusy,
  onPreview,
}: ProductFormProps) {
  const prefix = useId()
  const inputClass =
    'mt-2 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm'
  const fields: {
    key: keyof ProductFormValues
    label: string
    type?: string
    required?: boolean
    wide?: boolean
  }[] = [
    { key: 'name', label: 'Product name', required: true, wide: true },
    { key: 'category', label: 'Product category', required: true },
    { key: 'unit', label: 'Quantity unit', required: true },
    { key: 'description', label: 'Product description', required: true, wide: true },
    {
      key: 'price',
      label: `Price in INR per ${values.unit || 'selected unit'}`,
      type: 'number',
      required: true,
    },
    { key: 'stock', label: 'Available stock quantity', type: 'number', required: true },
    { key: 'city', label: 'Village / City', required: true },
    { key: 'district', label: 'District', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'harvestDate', label: 'Harvest date (optional)', type: 'date' },
  ]
  return (
    <form
      noValidate
      onSubmit={onPreview}
      className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7"
    >
      <p className="text-sm leading-6 text-stone-600">
        Required fields are marked *. Preview your details, then choose Save Draft or Publish on the
        review screen.
      </p>
      {Object.values(errors).some(Boolean) && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          Please correct the highlighted fields.
        </p>
      )}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {fields.map(field => {
          const id = `${prefix}-${field.key}`
          const common = {
            id,
            name: field.key,
            value: values[field.key],
            required: field.required,
            onChange: (event: { target: { value: string } }) =>
              onChange(field.key, event.target.value),
            'aria-invalid': !!errors[field.key],
            'aria-describedby': errors[field.key] ? id + '-error' : undefined,
            className: inputClass,
          }
          return (
            <div key={field.key} className={`min-w-0 ${field.wide ? 'sm:col-span-2' : ''}`}>
              <label htmlFor={id} className="text-sm font-semibold">
                {field.label}
                {field.required ? ' *' : ''}
              </label>
              {field.key === 'category' ? (
                <select {...common}>
                  <option value="">Select category</option>
                  {categoryOptions.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              ) : field.key === 'unit' ? (
                <select {...common}>
                  <option value="">Select unit</option>
                  {productUnits.map(unit => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              ) : field.key === 'description' ? (
                <textarea {...common} rows={5} maxLength={productFieldLimits.description} />
              ) : (
                <input
                  {...common}
                  type={field.type ?? 'text'}
                  maxLength={
                    field.key in productFieldLimits
                      ? productFieldLimits[field.key as keyof typeof productFieldLimits]
                      : undefined
                  }
                  min={
                    field.type === 'number'
                      ? field.key === 'price'
                        ? '0.01'
                        : '0'
                      : field.type === 'date'
                        ? '1900-01-01'
                        : undefined
                  }
                  max={field.type === 'number' ? MAX_PRODUCT_AMOUNT : undefined}
                  step={field.type === 'number' ? '0.01' : undefined}
                />
              )}
              {errors[field.key] && (
                <p id={id + '-error'} className="mt-2 text-sm text-red-700">
                  {errors[field.key]}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="my-5 text-xs leading-6 text-stone-500">
        Stock is the available amount of this product in its selected unit, not an order quantity.
        Up to two decimal places are supported. Location does not confirm delivery coverage. Harvest
        dates cannot be in the future.
      </p>
      <ProductImageUpload
        image={image}
        error={errors.image}
        busy={imageBusy}
        onChange={onImageChange}
        onBusy={onImageBusy}
      />
      <button
        type="submit"
        disabled={imageBusy}
        className="button-primary mt-6 disabled:cursor-wait disabled:opacity-60"
      >
        Preview Product
      </button>
    </form>
  )
}
