import api from './api'
import type { Customer, PaginatedResponse } from '@/types/models'

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const { data } = await api.get('/api/v1/customer?per_page=10000')
    return data.results
  },

  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<Customer>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/customer?page=${page}&per_page=${perPage}`)
    return data
  },

  async create(body: Partial<Customer>): Promise<Customer> {
    const { data } = await api.post('/api/v1/customer', body)
    return data
  },

  async update(id: number, body: Partial<Customer>): Promise<Customer> {
    const { data } = await api.put(`/api/v1/customer/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/customer/${id}`)
  },
}
