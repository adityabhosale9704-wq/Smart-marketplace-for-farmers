import type {
  SellerListingSummary,
  SellerListingCounts,
  SellerProductEditErrors,
  SellerProductEditValues,
  SellerProductFilters,
  SellerProductStatus,
} from '../types/seller'
import { MAX_PRODUCT_AMOUNT } from './productValidation'

export const sellerProductStatuses: SellerProductStatus[] = ['Active', 'Draft', 'Out of Stock']

// Draft takes precedence. Published listings with zero stock are Out of Stock.
export function sellerProductStatus(listing: SellerListingSummary): SellerProductStatus {
  if (!listing.published) return 'Draft'
  return listing.availableQuantity > 0 ? 'Active' : 'Out of Stock'
}

export function sellerListingCounts(listings: SellerListingSummary[]): SellerListingCounts {
  return listings.reduce(
    (counts, listing) => {
      counts.total++
      const status = sellerProductStatus(listing)
      if (status === 'Active') counts.active++
      else if (status === 'Draft') counts.draft++
      else counts.outOfStock++
      return counts
    },
    { total: 0, active: 0, draft: 0, outOfStock: 0 },
  )
}

export function filterSellerProducts(
  listings: SellerListingSummary[],
  filters: SellerProductFilters,
): SellerListingSummary[] {
  const query = filters.search.trim().replace(/\s+/g, ' ').toLowerCase()
  return listings.filter(
    listing =>
      listing.name.toLowerCase().includes(query) &&
      (!filters.category || listing.category === filters.category) &&
      (!filters.status || sellerProductStatus(listing) === filters.status),
  )
}

export function sellerEditValues(listing: SellerListingSummary): SellerProductEditValues {
  return {
    name: listing.name,
    price: String(listing.price),
    stock: String(listing.availableQuantity),
    status: sellerProductStatus(listing),
  }
}

export function validateSellerEdit(values: SellerProductEditValues): SellerProductEditErrors {
  const errors: SellerProductEditErrors = {}
  const name = values.name.trim()
  if (name.length < 3 || name.length > 100 || !/[\p{L}\p{N}]/u.test(name))
    errors.name = 'Enter a product name of 3–100 characters containing letters or numbers.'
  for (const field of ['price', 'stock'] as const) {
    const text = values[field].trim()
    const amount = Number(text)
    if (
      !/^\d+(?:\.\d{1,2})?$/.test(text) ||
      !Number.isFinite(amount) ||
      amount > MAX_PRODUCT_AMOUNT ||
      (field === 'price' ? amount <= 0 : amount < 0)
    ) {
      errors[field] =
        field === 'price'
          ? 'Enter a price above zero, up to 1,000,000 INR, with at most two decimal places.'
          : 'Enter stock from zero to 1,000,000 listed units, with at most two decimal places.'
    }
  }
  if (!sellerProductStatuses.includes(values.status))
    errors.status = 'Choose a supported listing status.'
  else if (!errors.stock && values.status === 'Active' && Number(values.stock) === 0)
    errors.status = 'Active requires stock above zero. Choose Out of Stock or Draft.'
  else if (!errors.stock && values.status === 'Out of Stock' && Number(values.stock) > 0)
    errors.status = 'Out of Stock requires zero stock. Choose Active or Draft.'
  return errors
}

export function applySellerEdit(
  listing: SellerListingSummary,
  values: SellerProductEditValues,
): SellerListingSummary {
  if (Object.keys(validateSellerEdit(values)).length) return listing
  return {
    ...listing,
    name: values.name.trim().replace(/\s+/g, ' '),
    price: Number(values.price.trim()),
    availableQuantity: Number(values.stock.trim()),
    published: values.status !== 'Draft',
  }
}
