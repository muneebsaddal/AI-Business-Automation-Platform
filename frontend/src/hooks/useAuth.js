import { useMutation, useQuery } from '@tanstack/react-query'

import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'

async function fetchCurrentUser(accessToken) {
  const response = await apiClient.get('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return response.data
}

export function useAuth() {
  const { user, accessToken, setAuth, setUser, clearAuth } = useAuthStore()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me')
      setUser(response.data)
      return response.data
    },
    enabled: Boolean(accessToken),
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const tokenResponse = await apiClient.post('/auth/login', credentials)
      const currentUser = await fetchCurrentUser(tokenResponse.data.access_token)
      setAuth(tokenResponse.data, currentUser)
      return currentUser
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      await apiClient.post('/auth/register', data)
      const tokenResponse = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      })
      const currentUser = await fetchCurrentUser(tokenResponse.data.access_token)
      setAuth(tokenResponse.data, currentUser)
      return currentUser
    },
  })

  return {
    user,
    token: accessToken,
    isAuthenticated: Boolean(accessToken),
    isLoading: meQuery.isLoading || loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: clearAuth,
  }
}
