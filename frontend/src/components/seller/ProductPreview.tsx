import MarketplaceImage from '../MarketplaceImage'
import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import type { ProductFormValues, ProductImageSelection } from '../../types/productForm'
import { categoryOptions } from '../../data/categories'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export default function ProductPreview({
  values,
  image,
  onEdit,
}: {
  values: ProductFormValues
  image: ProductImageSelection | null
  onEdit: () => void
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      <p className="rounded-lg bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
        Demonstration preview only. The product has not been saved or published.
      </p>
      {image ? (
        <MarketplaceImage
          src={image.url}
          alt={values.name}
          eager
          className="mt-6 h-72 w-full rounded-2xl bg-emerald-50"
        />
      ) : (
        <div className="mt-6 flex h-56 flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-50 text-emerald-800">
          <Sprout aria-hidden="true" className="size-10" />
          <p className="text-sm">No product image selected</p>
        </div>
      )}
      <p className="mt-6 text-sm font-semibold text-emerald-700">
        {categoryOptions.find(category => category.id === values.category)?.name}
      </p>
      <h2 className="mt-3 break-words text-3xl font-bold text-emerald-950">{values.name}</h2>
      <p className="mt-4 text-2xl font-bold text-emerald-800">
        {currency.format(Number(values.price))} / {values.unit}
      </p>
      <p className="mt-3 text-sm text-stone-600">
        Available quantity: {Number(values.stock)} {values.unit}
        {Number(values.stock) === 0 ? ' (out of stock)' : ''}
      </p>
      <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-stone-600">
        {values.description}
      </p>
      <p className="mt-5 break-words text-sm text-stone-600">
        Location: {values.city}, {values.district}, {values.state}
      </p>
      {values.harvestDate && (
        <p className="mt-3 text-sm text-stone-600">Harvest date: {values.harvestDate}</p>
      )}
      <div className="mt-7 flex flex-wrap gap-4">
        <button onClick={onEdit} className="button-secondary">
          Edit Details
        </button>
        <Link to="/seller/dashboard" className="button-primary">
          Back to Seller Dashboard
        </Link>
      </div>
    </section>
  )
}
