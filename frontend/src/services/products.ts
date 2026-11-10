import { authRequest, AuthRequestError, getAuthenticatedSession } from './auth'
import { categoryOptions } from '../data/categories'
import { productUnits } from '../types/productForm'
import type { ProductFormValues } from '../types/productForm'
import type { SellerListingSummary, SellerProductEditValues } from '../types/seller'

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
