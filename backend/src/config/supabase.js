import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL?.trim()
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()

if (!supabaseUrl || !publishableKey) {
  console.error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend/.env before starting.')
  process.exit(1)
}

if (!publishableKey.startsWith('sb_publishable_')) {
  console.error(
    'SUPABASE_PUBLISHABLE_KEY must be a publishable key, not a secret or service-role key.',
  )
  process.exit(1)
}

try {
  const url = new URL(supabaseUrl)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol')
} catch {
  console.error('SUPABASE_URL must be a valid HTTP or HTTPS project URL.')
  process.exit(1)
}

export function createSupabaseClient(accessToken) {
  return createClient(supabaseUrl, publishableKey, {
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

const supabase = createSupabaseClient()

export default supabase
