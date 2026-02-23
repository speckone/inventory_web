import api from './api'
import type { OrderItem, PaginatedResponse } from '@/types/models'

export const orderItemService = {
  async getAll(): Promise<OrderItem[]> {
    const { data } = await api.get('/api/v1/orderitem?per_page=10000')
    return data.results
  },

  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<OrderItem>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/orderitem?page=${page}&per_page=${perPage}`)
    return data
  },

  async updateQuantity(id: number, quantity: number): Promise<OrderItem> {
    const { data } = await api.put(`/api/v1/orderitem/${id}`, { quantity })
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/orderitem/${id}`)
  },
}
