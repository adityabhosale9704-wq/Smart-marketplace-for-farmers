import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { createSupabaseClient } from '../config/supabase.js'

const router = Router()
router.use((request, response, next) => {
  response.set('Cache-Control', 'no-store')
  next()
})
router.use(requireAuth, requireAdmin)

router.get('/me', (request, response) => {
  response.json({ ...request.user, role: 'admin' })
})

router.get('/dashboard', async (request, response) => {
  const client = createSupabaseClient(request.accessToken)
  const { data, error, status } = await client
    .rpc('admin_dashboard_counts')
    .single()
    .abortSignal(AbortSignal.timeout(5000))
  if (error)
    return response.status(status === 401 ? 401 : error.code === '42501' ? 403 : 503).json({
      message:
        error.code === '42501'
          ? 'Administrator access required.'
          : 'Administrator counts are unavailable. Check the database setup or try again.',
    })
  if (
    !data ||
    !['users_count', 'products_count', 'orders_count'].every(
      key => Number.isSafeInteger(data[key]) && data[key] >= 0,
    )
  )
    return response.status(503).json({ message: 'Administrator counts could not be verified.' })
  response.json({
    users: data.users_count,
    products: data.products_count,
    orders: data.orders_count,
  })
})

export default router
