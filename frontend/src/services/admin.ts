import { authRequest, AuthRequestError, getAuthenticatedSession } from './auth'

async function adminRequest(path: string, userId: string, signal?: AbortSignal) {
  const session = await getAuthenticatedSession()
  if (!session || session.user.id !== userId)
    throw new AuthRequestError('Please log in again before accessing administration.', 401)
  signal?.throwIfAborted()
  return authRequest('/api/admin' + path, {
    method: 'GET',
    headers: { Authorization: `Bearer ${session.accessToken}` },
    signal,
  })
}

export async function checkAdminAccess(userId: string, signal?: AbortSignal): Promise<void> {
  const data = await adminRequest('/me', userId, signal)
  if (
    !data ||
    typeof data !== 'object' ||
    !('id' in data) ||
    data.id !== userId ||
    !('role' in data) ||
    data.role !== 'admin'
  )
    throw new Error('Administrator access could not be verified.')
}

export async function getAdminDashboard(
  userId: string,
  signal?: AbortSignal,
): Promise<{ users: number; products: number; orders: number }> {
  const data = await adminRequest('/dashboard', userId, signal)
  if (
    !data ||
    typeof data !== 'object' ||
    !('users' in data) ||
    !('products' in data) ||
    !('orders' in data) ||
    ![data.users, data.products, data.orders].every(
      value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0,
    )
  )
    throw new Error('The administrator dashboard response was incomplete.')
  return {
    users: data.users as number,
    products: data.products as number,
    orders: data.orders as number,
  }
}
