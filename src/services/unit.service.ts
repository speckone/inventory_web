import api from './api'
import type { Unit } from '@/types/models'

export const unitService = {
  async getAll(): Promise<Unit[]> {
    const { data } = await api.get('/api/v1/unit?per_page=10000')
    return data.results
  },

  async create(body: Partial<Unit>): Promise<Unit> {
    const { data } = await api.post('/api/v1/unit', body)
    return data
  },

  async update(id: number, body: Partial<Unit>): Promise<Unit> {
    const { data } = await api.put(`/api/v1/unit/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/unit/${id}`)
  },
}
