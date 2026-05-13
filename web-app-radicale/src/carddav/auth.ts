import { useUserStore, useAuthStore } from '@opencloud-eu/web-pkg'
import { isRef } from 'vue'
import type { User } from '@opencloud-eu/web-client/graph/generated'

let userStore: ReturnType<typeof useUserStore> | null = null
let authStore: ReturnType<typeof useAuthStore> | null = null

export function initAuthStore(store: ReturnType<typeof useAuthStore>): void {
  authStore = store
}

export function initUserStore(store: ReturnType<typeof useUserStore>): void {
  userStore = store
}

export function getAccessToken(): string | null {
  if (!authStore) return null
  const token = authStore.accessToken
  if (isRef(token)) {
    return token.value as string || null
  }
  return (token as string) || null
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

export function getUserId(): string | null {
  if (!userStore) return null
  const user = userStore.user
  if (!user) return null
  const info = isRef(user) ? user.value : user
  if (!info) return null
  return (info as User)?.id || (info as User)?.mail || (info as User)?.displayName || null
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)

  const userId = getUserId()
  if (userId) {
    headers.set('X-Remote-User', userId)
  }

  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
}