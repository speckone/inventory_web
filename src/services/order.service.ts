import api from './api'
import type { Order, PaginatedResponse } from '@/types/models'

export const orderService = {
  async getByStatus(status: string): Promise<Order[]> {
    const { data } = await api.get(`/api/v1/order?status=${status}&per_page=10000`)
    return data.results
  },

  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<Order>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/order?page=${page}&per_page=${perPage}`)
    return data
  },

  async getPageByStatus(status: string, params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<Order>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/order?status=${status}&page=${page}&per_page=${perPage}`)
    return data
  },

  async create(): Promise<Order> {
    const { data } = await api.post('/api/v1/order', {})
    return data
  },

  async updateStatus(id: number, status: string): Promise<Order> {
    const { data } = await api.put(`/api/v1/order/${id}`, { status })
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/order/${id}`)
  },
}
