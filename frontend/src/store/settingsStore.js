import { create } from 'zustand'

const storedSettings = JSON.parse(localStorage.getItem('ai_ops_settings') || 'null')

export const useSettingsStore = create((set) => ({
  openAiKey: storedSettings?.openAiKey || '',
  defaultTaskType: storedSettings?.defaultTaskType || 'lead',
  notifyOnComplete: storedSettings?.notifyOnComplete ?? true,
  notifyOnEscalation: storedSettings?.notifyOnEscalation ?? true,
  updateSettings: (updates) =>
    set((state) => {
      const nextSettings = { ...state, ...updates }
      localStorage.setItem('ai_ops_settings', JSON.stringify(nextSettings))
      return nextSettings
    }),
}))

