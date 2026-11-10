import supabase from '../config/supabase.js'

export async function requireAuth(request, response, next) {
  const authorization = request.get('Authorization')
  const bearer = authorization?.match(/^Bearer ([^\s,]+)$/i)

  if (!bearer) {
    return response.status(401).json({ message: 'A Bearer access token is required' })
  }

  try {
    const { data, error } = await supabase.auth.getUser(bearer[1])

    if (error) {
      const invalidToken = [400, 401, 403, 422].includes(error.status)
      return response.status(invalidToken ? 401 : 503).json({
        message: invalidToken
          ? 'Invalid or expired access token'
          : 'Authentication service unavailable',
      })
    }

    if (!data.user?.id) {
      return response.status(401).json({ message: 'Invalid or expired access token' })
    }

    request.user = { id: data.user.id, email: data.user.email ?? null }
    request.accessToken = bearer[1]
    request.profileFullName =
      typeof data.user.user_metadata?.fullName === 'string' ? data.user.user_metadata.fullName : ''
  } catch {
    return response.status(503).json({ message: 'Authentication service unavailable' })
  }

  next()
}
