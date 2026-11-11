import { createSupabaseClient } from '../config/supabase.js'

export async function requireAdmin(request, response, next) {
  try {
    const client = createSupabaseClient(request.accessToken)
    const { data, error, status } = await client
      .from('profiles')
      .select('role')
      .eq('id', request.user.id)
      .maybeSingle()
      .abortSignal(AbortSignal.timeout(5000))
    if (error)
      return response.status(status === 401 ? 401 : 503).json({
        message:
          status === 401
            ? 'Your session expired. Please log in again.'
            : 'Administrator authorization is unavailable. Confirm the admin migration has been applied.',
      })
    if (data?.role !== 'admin')
      return response.status(403).json({ message: 'Administrator access required.' })
  } catch {
    return response
      .status(503)
      .json({ message: 'Administrator authorization is unavailable. Please try again.' })
  }
  next()
}
