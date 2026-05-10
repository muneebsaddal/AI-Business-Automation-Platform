import { useMutation, useQuery } from '@tanstack/react-query'

import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'

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
      const previousToken = useAuthStore.getState().accessToken
      useAuthStore.setState({ accessToken: tokenResponse.data.access_token })
      const meResponse = await apiClient.get('/auth/me')
      useAuthStore.setState({ accessToken: previousToken })
      setAuth(tokenResponse.data, meResponse.data)
      return meResponse.data
    },
  })

  return {
    user,
    token: accessToken,
    isAuthenticated: Boolean(accessToken),
    isLoading: meQuery.isLoading || loginMutation.isPending,
    login: loginMutation.mutateAsync,
    logout: clearAuth,
  }
}
