import { apiClient } from './client'

export const submitTask = async (data) => {
  const response = await apiClient.post('/execute', data)
  return response.data
}

export const getTask = async (id) => {
  const response = await apiClient.get(`/tasks/${id}`)
  return response.data
}

export const listTasks = async (filters = {}) => {
  const response = await apiClient.get('/tasks', { params: filters })
  return response.data
}

export const deleteTask = async (id) => {
  await apiClient.delete(`/tasks/${id}`)
}

export const rerunTask = async (id) => {
  const response = await apiClient.post(`/tasks/${id}/rerun`)
  return response.data
}

export const exportTrace = async (id) => {
  const response = await apiClient.get(`/tasks/${id}/export`)
  return response.data
}

export const getAnalytics = async () => {
  const response = await apiClient.get('/analytics')
  return response.data
}
