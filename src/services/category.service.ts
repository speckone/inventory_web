import api from './api'
import type { Category } from '@/types/models'

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data } = await api.get('/api/v1/category')
    return data
  },

  async create(body: Partial<Category>): Promise<Category> {
    const { data } = await api.post('/api/v1/category', body)
    return data
  },

  async update(id: number, body: Partial<Category>): Promise<Category> {
    const { data } = await api.put(`/api/v1/category/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/category/${id}`)
  },
}
