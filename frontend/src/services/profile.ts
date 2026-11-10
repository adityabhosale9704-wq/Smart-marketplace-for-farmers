import { authRequest, AuthRequestError, getAuthenticatedSession } from './auth'
import type { FarmerProfile, ProfileResult } from '../types/profile'

export async function requestProfile(
  method: 'GET' | 'PUT',
  expectedUserId: string,
  profile?: FarmerProfile,
  signal?: AbortSignal,
): Promise<ProfileResult> {
  const session = await getAuthenticatedSession()
  if (!session) throw new AuthRequestError('Please log in to view your profile.', 401)
  if (session.user.id !== expectedUserId)
    throw new AuthRequestError(
      'Your signed-in account changed. Reload your profile before editing.',
      401,
    )
  signal?.throwIfAborted()
  const data = await authRequest('/api/profile', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
    body: profile
      ? JSON.stringify({
          fullName: profile.fullName,
          mobile: profile.mobile,
          city: profile.city,
          district: profile.district,
          state: profile.state,
          pinCode: profile.pinCode,
        })
      : undefined,
    signal,
  })
  if (
    !data ||
    typeof data !== 'object' ||
    !('profile' in data) ||
    !data.profile ||
    typeof data.profile !== 'object' ||
    !('needsCompletion' in data) ||
    typeof data.needsCompletion !== 'boolean'
  ) {
    throw new Error('The profile response was incomplete. Please try again.')
  }
  const fields = ['fullName', 'email', 'mobile', 'city', 'district', 'state', 'pinCode']
  const record = data.profile as Record<string, unknown>
  if (!fields.every(field => typeof record[field] === 'string'))
    throw new Error('The profile response was incomplete. Please try again.')
  return { profile: data.profile as FarmerProfile, needsCompletion: data.needsCompletion }
}
