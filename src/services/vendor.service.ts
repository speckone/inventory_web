import api from './api'
import type { Vendor } from '@/types/models'

export const vendorService = {
  async getAll(): Promise<Vendor[]> {
    const { data } = await api.get('/api/v1/vendor')
    return data
  },

  async create(body: Partial<Vendor>): Promise<Vendor> {
    const { data } = await api.post('/api/v1/vendor', body)
    return data
  },

  async update(id: number, body: Partial<Vendor>): Promise<Vendor> {
    const { data } = await api.put(`/api/v1/vendor/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/vendor/${id}`)
  },
}
