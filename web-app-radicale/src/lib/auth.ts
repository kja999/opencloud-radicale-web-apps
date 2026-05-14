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
    return null
  }
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
    return null
  }
}

export interface AuthHeaders {
  authorization?: string
  'x-remote-user'?: string
}

export function buildAuthHeaders(): AuthHeaders {
  const headers: AuthHeaders = {}
  const token = getAccessToken()
  if (token) {
    headers.authorization = `Bearer ${token}`
  }
  const userId = getUserId()
  if (userId) {
    headers['x-remote-user'] = userId
  }
  return headers
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  mode: 'caldav' | 'carddav' = 'caldav'
): Promise<Response> {
  const headers = new Headers(options.headers)
  const authHeaders = buildAuthHeaders()

  if (authHeaders.authorization) {
    headers.set('Authorization', authHeaders.authorization)
  }
  if (authHeaders['x-remote-user']) {
    headers.set('X-Remote-User', authHeaders['x-remote-user'])
  }

  console.log(`[${mode.toUpperCase()}] Fetch:`, url, {
    hasUserId: !!authHeaders['x-remote-user'],
    hasToken: !!authHeaders.authorization
  })

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
}
