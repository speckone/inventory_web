import api from './api'
import type { AppSettings } from '@/types/models'

export const settingsService = {
  async getAll(): Promise<AppSettings> {
    const { data } = await api.get('/api/v1/settings')
    return data.settings
  },

  async update(key: string, value: string): Promise<void> {
    await api.put(`/api/v1/settings/${key}`, { value })
  },
}
