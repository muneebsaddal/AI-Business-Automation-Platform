import axios from 'axios'

import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const openAiKey = useSettingsStore.getState().openAiKey
  if (openAiKey) {
    config.headers['X-OpenAI-Key'] = openAiKey
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const store = useAuthStore.getState()

    if (status === 401 && !originalRequest._retry && store.refreshToken) {
      originalRequest._retry = true
      try {
        const response = await axios.post(
          '/auth/refresh',
          { refresh_token: store.refreshToken },
          { baseURL: apiClient.defaults.baseURL },
        )
        store.setAuth(response.data, store.user)
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        store.clearAuth()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
