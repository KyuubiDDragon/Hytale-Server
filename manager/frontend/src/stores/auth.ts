import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type TokenResponse } from '@/api/auth'

// Safe localStorage access for SSR/build compatibility
const getStorageItem = (key: string): string | null => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key)
  }
  return null
}

const setStorageItem = (key: string, value: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value)
  }
}

const removeStorageItem = (key: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key)
  }
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const accessToken = ref<string | null>(getStorageItem('accessToken'))
  const refreshToken = ref<string | null>(getStorageItem('refreshToken'))
  const username = ref<string | null>(getStorageItem('username'))

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)

  // Actions
  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    setStorageItem('accessToken', access)
    setStorageItem('refreshToken', refresh)
  }

  function setUser(name: string) {
    username.value = name
    setStorageItem('username', name)
  }

  async function login(credentials: { username: string; password: string }) {
    const response = await authApi.login(credentials)
    setTokens(response.access_token, response.refresh_token)
    setUser(credentials.username)
    return response
  }

  async function refresh() {
    if (!refreshToken.value) {
      throw new Error('No refresh token')
    }
    const response = await authApi.refresh(refreshToken.value)
    setTokens(response.access_token, response.refresh_token)
    return response
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    username.value = null
    removeStorageItem('accessToken')
    removeStorageItem('refreshToken')
    removeStorageItem('username')
  }

  return {
    // State
    accessToken,
    refreshToken,
    username,
    // Getters
    isAuthenticated,
    // Actions
    setTokens,
    setUser,
    login,
    refresh,
    logout,
  }
})
