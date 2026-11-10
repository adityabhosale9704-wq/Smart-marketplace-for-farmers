import { authRequest, AuthRequestError, getAuthenticatedSession } from './auth'
import { categoryOptions } from '../data/categories'
import { productUnits } from '../types/productForm'
import type { ProductFormValues } from '../types/productForm'
import type { SellerListingSummary, SellerProductEditValues } from '../types/seller'
import type { Product } from '../types/product'
import type { ProductFilters } from './filterProducts'

export async function getMarketplaceProducts(
  filters: ProductFilters,
  signal?: AbortSignal,
): Promise<{
  products: Product[]
  locations: string[]
  sellerNamesAvailable: boolean
}> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters))
    if (value.trim()) params.set(key, value.trim())
  const data = await authRequest('/api/products?' + params.toString(), { method: 'GET', signal })
  if (
    !data ||
    typeof data !== 'object' ||
    !('products' in data) ||
    !Array.isArray(data.products) ||
    !('locations' in data) ||
    !Array.isArray(data.locations) ||
    !data.locations.every(value => typeof value === 'string') ||
    !('sellerNamesAvailable' in data) ||
    typeof data.sellerNamesAvailable !== 'boolean'
  )
    throw new Error('The marketplace response was incomplete. Please try again.')
  const products = data.products.map((value: unknown): Product => {
    if (!value || typeof value !== 'object')
      throw new Error('A marketplace product was incomplete.')
    const row = value as Record<string, unknown>
    const strings = ['id', 'name', 'description', 'city', 'district', 'state']
    if (
      !strings.every(field => typeof row[field] === 'string') ||
      !categoryOptions.some(category => category.id === row.category) ||
      !productUnits.includes(row.unit as 'kg' | 'quintal') ||
      typeof row.price !== 'number' ||
      !Number.isFinite(row.price) ||
      row.price <= 0 ||
      typeof row.available_quantity !== 'number' ||
      !Number.isFinite(row.available_quantity) ||
      row.available_quantity <= 0 ||
      !(row.seller_name === null || typeof row.seller_name === 'string')
    )
      throw new Error('A marketplace product was incomplete.')
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      category: row.category as Product['category'],
      price: row.price,
      unit: row.unit as Product['unit'],
      availableQuantity: row.available_quantity,
      location: [row.city, row.district, row.state].filter(Boolean).join(', '),
      seller:
        typeof row.seller_name === 'string' && row.seller_name.trim()
          ? row.seller_name
          : 'Seller name not provided',
      image: '', // Storage and uploaded images are not integrated yet.
    }
  })
  return { products, locations: data.locations, sellerNamesAvailable: data.sellerNamesAvailable }
}

async function productRequest(
  path: string,
  userId: string,
  options: RequestInit,
  signal?: AbortSignal,
) {
  const session = await getAuthenticatedSession()
  if (!session || session.user.id !== userId)
    throw new AuthRequestError('Please log in again before managing your products.', 401)
  signal?.throwIfAborted()
  return authRequest('/api/products' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
    signal,
  })
}

function readProduct(value: unknown, userId: string): SellerListingSummary {
  if (!value || typeof value !== 'object') throw new Error('The product response was incomplete.')
  const row = value as Record<string, unknown>
  if (
    typeof row.id !== 'string' ||
    typeof row.name !== 'string' ||
    row.seller_id !== userId ||
    !categoryOptions.some(category => category.id === row.category) ||
    !productUnits.includes(row.unit as 'kg' | 'quintal') ||
    !['draft', 'published'].includes(String(row.listing_status)) ||
    typeof row.price !== 'number' ||
    typeof row.available_quantity !== 'number' ||
    !Number.isFinite(row.price) ||
    row.price <= 0 ||
    !Number.isFinite(row.available_quantity) ||
    row.available_quantity < 0
  )
    throw new Error('The product response was incomplete or did not belong to your account.')
  return {
    id: row.id,
    name: row.name,
    category: row.category as SellerListingSummary['category'],
    price: row.price,
    unit: row.unit as SellerListingSummary['unit'],
    availableQuantity: row.available_quantity,
    published: row.listing_status === 'published',
  }
}

export async function getMyProducts(
  userId: string,
  signal?: AbortSignal,
): Promise<SellerListingSummary[]> {
  const data = await productRequest('/mine', userId, { method: 'GET' }, signal)
  if (!Array.isArray(data)) throw new Error('The product list response was incomplete.')
  return data.map(row => readProduct(row, userId))
}

export async function createProduct(
  userId: string,
  values: ProductFormValues,
  listingStatus: 'draft' | 'published',
  signal?: AbortSignal,
) {
  const data = await productRequest(
    '',
    userId,
    { method: 'POST', body: JSON.stringify({ ...values, listingStatus }) },
    signal,
  )
  return readProduct(data, userId)
}

export async function updateProduct(
  userId: string,
  id: string,
  values: SellerProductEditValues,
  signal?: AbortSignal,
) {
  const data = await productRequest(
    '/' + encodeURIComponent(id),
    userId,
    {
      method: 'PUT',
      body: JSON.stringify({
        name: values.name,
        price: values.price,
        stock: values.stock,
        listingStatus: values.status === 'Draft' ? 'draft' : 'published',
      }),
    },
    signal,
  )
  return readProduct(data, userId)
}
