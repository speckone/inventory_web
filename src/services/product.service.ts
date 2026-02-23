import api from './api'
import type { Product, Order, PaginatedResponse } from '@/types/models'

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data } = await api.get('/api/v1/product?per_page=10000')
    return data.results
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

  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<Product>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/product?page=${page}&per_page=${perPage}`)
    return data
  },

  async getHistory(id: number): Promise<Order[]> {
    const { data } = await api.get(`/api/v1/product/${id}/history?per_page=10000`)
    return data.results
  },
}
