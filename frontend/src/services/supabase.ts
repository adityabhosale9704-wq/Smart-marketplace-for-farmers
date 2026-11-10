import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

// Recovery credentials are handled separately by ResetPassword, never persisted here.
const supabase =
  !import.meta.env.SSR &&
  typeof window !== 'undefined' &&
  url &&
  URL.canParse(url) &&
  /^https?:\/\//.test(url) &&
  publishableKey?.startsWith('sb_publishable_')
    ? createClient(url, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null

export default supabase
