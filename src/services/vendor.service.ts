import api from './api'
import type { Vendor, PaginatedResponse } from '@/types/models'

export const vendorService = {
  async getAll(): Promise<Vendor[]> {
    const { data } = await api.get('/api/v1/vendor?per_page=10000')
    return data.results
  },

  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<Vendor>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/vendor?page=${page}&per_page=${perPage}`)
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
