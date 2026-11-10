import { Router } from 'express'
import { createSupabaseClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const columns =
  'id,seller_id,name,category,description,price,unit,available_quantity,city,district,state,harvest_date,image_path,listing_status,created_at'
const categories = ['vegetables', 'fruits', 'grains', 'pulses', 'seeds', 'spices']
const createFields = [
  'name',
  'category',
  'description',
  'price',
  'unit',
  'stock',
  'city',
  'district',
  'state',
  'harvestDate',
  'listingStatus',
]
const editFields = ['name', 'price', 'stock', 'listingStatus']

function validateProduct(input, wasPublished = false) {
  const values = {}
  const errors = {}
  for (const field of createFields) {
    if (typeof input[field] !== 'string') {
      errors[field] = 'Enter a valid text value.'
      continue
    }
    values[field] = input[field].trim()
    if (values[field].includes('\u0000')) errors[field] = 'Remove unsupported characters.'
  }
  if (Object.keys(errors).length) return { values, errors }
  for (const field of ['name', 'city', 'district', 'state'])
    values[field] = values[field].replace(/\s+/g, ' ')
  if (values.name.length < 3 || values.name.length > 100 || !/[\p{L}\p{N}]/u.test(values.name))
    errors.name = 'Use a product name of 3–100 characters.'
  if (!categories.includes(values.category)) errors.category = 'Choose a supported category.'
  if (values.description.length < 20 || values.description.length > 2000)
    errors.description = 'Use a description of 20–2000 characters.'
  if (!['kg', 'quintal'].includes(values.unit)) errors.unit = 'Choose kg or quintal.'
  for (const field of ['price', 'stock']) {
    const value = values[field]
    if (
      !/^\d+(?:\.\d{1,2})?$/.test(value) ||
      Number(value) > 1000000 ||
      (field === 'price' && Number(value) <= 0)
    )
      errors[field] =
        field === 'price'
          ? 'Use a price above zero and at most 1,000,000, with up to two decimals.'
          : 'Use stock from zero to 1,000,000, with up to two decimals.'
  }
  for (const field of ['city', 'district', 'state']) {
    if (values[field].length < 2 || values[field].length > 100 || !/\p{L}/u.test(values[field]))
      errors[field] = 'Use a location of 2–100 characters containing letters.'
  }
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const date = new Date(values.harvestDate + 'T00:00:00Z')
  if (
    values.harvestDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(values.harvestDate) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== values.harvestDate ||
      values.harvestDate < '1900-01-01' ||
      values.harvestDate > today)
  )
    errors.harvestDate = 'Choose a real harvest date from 1900 through today.'
  if (!['draft', 'published'].includes(values.listingStatus))
    errors.listingStatus = 'Choose draft or published.'
  else if (values.listingStatus === 'published' && !wasPublished && Number(values.stock) <= 0)
    errors.stock = 'Publishing requires stock above zero. Save a draft instead.'
  return { values, errors }
}

function databaseError(response, error, status) {
  if (status === 401)
    return response.status(401).json({ message: 'Your session expired. Please log in again.' })
  if (error.code === '42501')
    return response.status(503).json({
      message:
        'Product saving is not enabled by the database permissions. The seller product permissions migration needs review and application.',
    })
  return response
    .status(503)
    .json({ message: 'The product request could not be completed. Please try again.' })
}

router.get('/', async (request, response) => {
  response.set('Cache-Control', 'no-store')
  const allowed = ['search', 'category', 'location', 'minPrice', 'maxPrice']
  if (
    Object.keys(request.query).some(key => !allowed.includes(key)) ||
    Object.values(request.query).some(value => typeof value !== 'string')
  )
    return response
      .status(400)
      .json({ message: 'Use one text value for each supported marketplace filter.' })
  const search = request.query.search?.trim().replace(/\s+/g, ' ') ?? ''
  const category = request.query.category?.trim() ?? ''
  const location = request.query.location?.trim() ?? ''
  const minPrice = request.query.minPrice?.trim() ?? ''
  const maxPrice = request.query.maxPrice?.trim() ?? ''
  if (
    search.length > 100 ||
    location.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(search + location)
  )
    return response.status(400).json({
      message:
        'Use a product name and location of at most 100 characters without control characters.',
    })
  if (category && !categories.includes(category))
    return response.status(400).json({ message: 'Choose a supported category.' })
  if (
    [minPrice, maxPrice].some(
      value => value && (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) > 1000000),
    ) ||
    (minPrice && maxPrice && Number(minPrice) > Number(maxPrice))
  )
    return response.status(400).json({
      message: 'Use a valid INR price range from zero to 1,000,000, with up to two decimals.',
    })

  // This public query deliberately does not forward a signed-in seller's token.
  const client = createSupabaseClient()
  let query = client
    .from('products')
    .select(
      'id,seller_id,name,description,category,price,unit,available_quantity,city,district,state,image_path',
    )
    .eq('listing_status', 'published')
    .gt('available_quantity', 0)
  if (search) query = query.ilike('name', '%' + search.replace(/[\\%_]/g, '\\$&') + '%')
  if (category) query = query.eq('category', category)
  if (location) query = query.eq('city', location)
  if (minPrice) query = query.gte('price', minPrice)
  if (maxPrice) query = query.lte('price', maxPrice)
  const [products, locations] = await Promise.all([
    query.order('created_at', { ascending: false }).abortSignal(AbortSignal.timeout(5000)),
    client
      .from('products')
      .select('city')
      .eq('listing_status', 'published')
      .gt('available_quantity', 0)
      .abortSignal(AbortSignal.timeout(5000)),
  ])
  if (products.error || locations.error)
    return response
      .status(503)
      .json({ message: 'Marketplace listings could not be loaded. Please try again.' })
  const rows = products.data ?? []
  let names = []
  let sellerNamesAvailable = true
  if (rows.length) {
    const result = await client
      .rpc('marketplace_seller_names', { seller_ids: [...new Set(rows.map(row => row.seller_id))] })
      .abortSignal(AbortSignal.timeout(5000))
    if (result.error) {
      // Older deployments can still show products without exposing private profiles.
      if (['PGRST202', '42501'].includes(result.error.code)) sellerNamesAvailable = false
      else
        return response
          .status(503)
          .json({ message: 'Marketplace seller names could not be loaded. Please try again.' })
    } else names = result.data ?? []
  }
  const sellerNames = new Map(names.map(seller => [seller.seller_id, seller.full_name]))
  response.json({
    products: rows.map(row => ({ ...row, seller_name: sellerNames.get(row.seller_id) ?? null })),
    locations: [...new Set((locations.data ?? []).map(row => row.city))].sort(),
    sellerNamesAvailable,
  })
})

router.use(requireAuth)
router.use((request, response, next) => {
  response.set('Cache-Control', 'no-store')
  next()
})

router.get('/mine', async (request, response) => {
  const client = createSupabaseClient(request.accessToken)
  const { data, error, status } = await client
    .from('products')
    .select(columns)
    .eq('seller_id', request.user.id)
    .order('created_at', { ascending: false })
    .abortSignal(AbortSignal.timeout(5000))
  if (error) return databaseError(response, error, status)
  response.json(data)
})

router.post('/', async (request, response) => {
  const input = request.body
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some(field => !createFields.includes(field))
  )
    return response.status(400).json({
      message: 'Send only product details. Seller identity and image paths cannot be supplied.',
    })
  const { values, errors } = validateProduct(input)
  if (Object.keys(errors).length)
    return response.status(400).json({ message: Object.values(errors)[0], errors })
  const client = createSupabaseClient(request.accessToken)
  const profile = await client
    .from('profiles')
    .select('id')
    .eq('id', request.user.id)
    .maybeSingle()
    .abortSignal(AbortSignal.timeout(5000))
  if (profile.error) return databaseError(response, profile.error, profile.status)
  if (!profile.data)
    return response
      .status(409)
      .json({ message: 'Save your farmer profile before adding a product.' })
  const { data, error, status } = await client
    .from('products')
    .insert({
      seller_id: request.user.id,
      name: values.name,
      category: values.category,
      description: values.description,
      price: values.price,
      unit: values.unit,
      available_quantity: values.stock,
      city: values.city,
      district: values.district,
      state: values.state,
      harvest_date: values.harvestDate || null,
      listing_status: values.listingStatus,
    })
    .select(columns)
    .single()
    .abortSignal(AbortSignal.timeout(5000))
  if (error) return databaseError(response, error, status)
  if (!data)
    return response.status(503).json({ message: 'The database did not confirm the saved product.' })
  response.status(201).json(data)
})

router.put('/:id', async (request, response) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.params.id))
    return response.status(404).json({ message: 'Product not found.' })
  const input = request.body
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some(field => !editFields.includes(field))
  )
    return response
      .status(400)
      .json({ message: 'Only name, price, stock and listing status can be edited here.' })
  const client = createSupabaseClient(request.accessToken)
  const existing = await client
    .from('products')
    .select(columns)
    .eq('id', request.params.id)
    .eq('seller_id', request.user.id)
    .maybeSingle()
    .abortSignal(AbortSignal.timeout(5000))
  if (existing.error) return databaseError(response, existing.error, existing.status)
  if (!existing.data) return response.status(404).json({ message: 'Product not found.' })
  const row = existing.data
  const { values, errors } = validateProduct(
    {
      category: row.category,
      description: row.description,
      unit: row.unit,
      city: row.city,
      district: row.district,
      state: row.state,
      harvestDate: row.harvest_date ?? '',
      ...input,
    },
    row.listing_status === 'published',
  )
  if (Object.keys(errors).length)
    return response.status(400).json({ message: Object.values(errors)[0], errors })
  const { data, error, status } = await client
    .from('products')
    .update({
      name: values.name,
      price: values.price,
      available_quantity: values.stock,
      listing_status: values.listingStatus,
    })
    .eq('id', request.params.id)
    .eq('seller_id', request.user.id)
    .select(columns)
    .maybeSingle()
    .abortSignal(AbortSignal.timeout(5000))
  if (error) return databaseError(response, error, status)
  if (!data) return response.status(404).json({ message: 'Product not found.' })
  response.json(data)
})

export default router
