import { useUserStore, useAuthStore } from '@opencloud-eu/web-pkg'
import { isRef } from 'vue'
import type { User } from '@opencloud-eu/web-client/graph/generated'

export function getAccessToken(): string | null {
  try {
    const authStore = useAuthStore()
    if (!authStore) return null
    const token = authStore.accessToken
    if (isRef(token)) {
      return (token.value as string) || null
    }
    return (token as string) || null
  } catch {
    console.warn('[CardDAV] Auth store not available')
    return null
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

export function getUserId(): string | null {
  try {
    const userStore = useUserStore()
    if (!userStore) return null
    const user = userStore.user
    if (!user) return null
    const info = isRef(user) ? user.value : user
    if (!info) return null
    return (info as User)?.id || (info as User)?.mail || (info as User)?.displayName || null
  } catch {
    console.warn('[CardDAV] User store not available')
    return null
  }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)

  const userId = getUserId()
  if (userId) {
    headers.set('X-Remote-User', userId)
  }

  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  console.log('[CardDAV] Fetch:', url, { hasUserId: !!userId, hasToken: !!token })

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
}
