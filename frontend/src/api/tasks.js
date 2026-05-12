import { apiClient } from './client'
import { isShowcaseMode } from '../config/showcase'
import {
  deleteShowcaseTask,
  exportShowcaseTrace,
  getShowcaseDashboardAnalytics,
  getShowcaseTask,
  listShowcaseTasks,
  rerunShowcaseTask,
  submitShowcaseTask,
} from './showcaseApi'

export const submitTask = async (data) => {
  if (isShowcaseMode) return submitShowcaseTask(data)
  const response = await apiClient.post('/execute', data)
  return response.data
}

export const getTask = async (id) => {
  if (isShowcaseMode) return getShowcaseTask(id)
  const response = await apiClient.get(`/tasks/${id}`)
  return response.data
}

export const listTasks = async (filters = {}) => {
  if (isShowcaseMode) return listShowcaseTasks(filters)
  const response = await apiClient.get('/tasks', { params: filters })
  return response.data
}

export const deleteTask = async (id) => {
  if (isShowcaseMode) return deleteShowcaseTask(id)
  await apiClient.delete(`/tasks/${id}`)
}

export const rerunTask = async (id) => {
  if (isShowcaseMode) return rerunShowcaseTask(id)
  const response = await apiClient.post(`/tasks/${id}/rerun`)
  return response.data
}

export const exportTrace = async (id) => {
  if (isShowcaseMode) return exportShowcaseTrace(id)
  const response = await apiClient.get(`/tasks/${id}/export`)
  return response.data
}

export const getAnalytics = async () => {
  if (isShowcaseMode) return getShowcaseDashboardAnalytics()
  const response = await apiClient.get('/analytics')
  return response.data
}
