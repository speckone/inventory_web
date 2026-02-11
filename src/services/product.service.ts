import api from './api'
import type { Product, Order } from '@/types/models'

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data } = await api.get('/api/v1/product')
    return data
  },

  async create(body: Partial<Product>): Promise<Product> {
    const { data } = await api.post('/api/v1/product', body)
    return data
  },

  async update(id: number, body: Partial<Product>): Promise<Product> {
    const { data } = await api.put(`/api/v1/product/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/product/${id}`)
  },

  async getHistory(id: number): Promise<Order[]> {
    const { data } = await api.get(`/api/v1/product/${id}/history`)
    return data
  },
}
