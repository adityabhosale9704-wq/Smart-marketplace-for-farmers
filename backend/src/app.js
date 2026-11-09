import express from 'express'
import cors from 'cors'
import supabase from './config/supabase.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://127.0.0.1:5173'

app.disable('x-powered-by')
app.use(cors({ origin: frontendOrigin }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', message: 'FarmMarket API is running' })
})

app.get('/api/db-health', async (request, response) => {
  const { error } = await supabase
    .from('products')
    .select('id')
    .limit(1)
    .abortSignal(AbortSignal.timeout(5000))

  if (error) {
    return response
      .status(503)
      .json({ status: 'error', message: 'Database connection unavailable' })
  }

  response.json({ status: 'ok', message: 'Database connection is working' })
})

app.get('/api/auth/me', requireAuth, (request, response) => {
  response.json(request.user)
})

app.use((request, response) => {
  response.status(404).json({ message: 'Route not found' })
})

// Keep parser errors and unexpected failures in JSON without exposing internals.
app.use((error, request, response, next) => {
  if (response.headersSent) return next(error)
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ message: 'Invalid JSON request body' })
  }
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ message: 'Request body is too large' })
  }
  response.status(500).json({ message: 'Internal server error' })
})

export default app
