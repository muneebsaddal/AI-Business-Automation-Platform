import { create } from 'zustand'

const storedAuth = JSON.parse(localStorage.getItem('ai_ops_auth') || 'null')

export const useAuthStore = create((set) => ({
  user: storedAuth?.user || null,
  accessToken: storedAuth?.accessToken || null,
  refreshToken: storedAuth?.refreshToken || null,
  setAuth: (tokens, user) => {
    const nextAuth = {
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    }
    localStorage.setItem('ai_ops_auth', JSON.stringify(nextAuth))
    set(nextAuth)
  },
  setUser: (user) => {
    set((state) => {
      const nextAuth = { ...state, user }
      localStorage.setItem('ai_ops_auth', JSON.stringify(nextAuth))
      return { user }
    })
  },
  clearAuth: () => {
    localStorage.removeItem('ai_ops_auth')
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))
