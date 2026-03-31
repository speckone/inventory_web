import api from './api'
import type { Customer, PaginatedResponse } from '@/types/models'

export const customerService = {
  async getAll(params?: { archived?: boolean }): Promise<Customer[]> {
    let url = '/api/v1/customer?per_page=10000'
    if (params?.archived) {
      url += '&archived=true'
    }
    const { data } = await api.get(url)
    return data.results
  },

  async getPage(params: { page?: number; perPage?: number; archived?: boolean } = {}): Promise<PaginatedResponse<Customer>> {
    const { page = 1, perPage = 25, archived } = params
    let url = `/api/v1/customer?page=${page}&per_page=${perPage}`
    if (archived) {
      url += '&archived=true'
    }
    const { data } = await api.get(url)
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
