import { categoryOptions } from '../data/categories'
import { productUnits } from '../types/productForm'
import type { ProductFormErrors, ProductFormValues } from '../types/productForm'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_PRODUCT_AMOUNT = 1000000
export const productFieldLimits = { name: 100, description: 2000, city: 100, district: 100, state: 100 }

export function validateProductImage(file: Pick<File, 'type' | 'size'>): string | undefined {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose a JPG, PNG, or WebP image.'
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return 'Choose a nonempty image of 5 MB or less.'
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && Number(value.slice(0, 4)) >= 1900
}

export function validateProduct(values: ProductFormValues, today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })): { values: ProductFormValues; errors: ProductFormErrors } {
  const cleaned = { ...values }
  const errors: ProductFormErrors = {}
  for (const key of ['name', 'description', 'price', 'stock', 'city', 'district', 'state', 'harvestDate'] as const) {
    cleaned[key] = cleaned[key].trim()
  }
  cleaned.name = cleaned.name.replace(/\s+/g, ' ')
  for (const key of ['city', 'district', 'state'] as const) cleaned[key] = cleaned[key].replace(/\s+/g, ' ')
  if (cleaned.name.length < 3 || cleaned.name.length > productFieldLimits.name || !/[\p{L}\p{N}]/u.test(cleaned.name)) errors.name = 'Enter a product name of 3-100 characters.'
  if (cleaned.description.length < 20 || cleaned.description.length > productFieldLimits.description) errors.description = 'Describe the product using 20-2000 characters.'
  if (!categoryOptions.some(category => category.id === cleaned.category)) errors.category = 'Choose a supported category.'
  if (!productUnits.includes(cleaned.unit as (typeof productUnits)[number])) errors.unit = 'Choose kg or quintal.'
  for (const field of ['price', 'stock'] as const) {
    const text = cleaned[field]
    const value = Number(text)
    const positive = field === 'price'
    if (!/^\d+(?:\.\d{1,2})?$/.test(text) || !Number.isFinite(value) || value > MAX_PRODUCT_AMOUNT || (positive ? value <= 0 : value < 0)) {
      errors[field] = positive
        ? 'Enter a price above 0 and at most 1,000,000 INR, using at most two decimal places.'
        : 'Enter stock from 0 to 1,000,000 listed units, using at most two decimal places.'
    }
  }
  for (const field of ['city', 'district', 'state'] as const) {
    if (cleaned[field].length < 2 || cleaned[field].length > productFieldLimits[field] || !/\p{L}/u.test(cleaned[field])) errors[field] = 'Enter a place name of 2-100 characters containing letters.'
  }
  if (cleaned.harvestDate && (!validDate(cleaned.harvestDate) || cleaned.harvestDate > today)) errors.harvestDate = 'Choose a real harvest date from 1900 through today.'
  return { values: cleaned, errors }
}
