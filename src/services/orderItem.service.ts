import api from './api'
import type { OrderItem } from '@/types/models'

export const orderItemService = {
  async getAll(): Promise<OrderItem[]> {
    const { data } = await api.get('/api/v1/orderitem')
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
