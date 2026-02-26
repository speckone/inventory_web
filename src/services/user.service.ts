import api from './api'
import type { ManagedUser, PaginatedResponse } from '@/types/models'

export const userService = {
  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<ManagedUser>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/users?page=${page}&per_page=${perPage}`)
    return data
  },

  async create(body: Partial<ManagedUser> & { password: string }): Promise<ManagedUser> {
    const { data } = await api.post('/api/v1/users', body)
    return data
  },

  async update(id: number, body: Partial<ManagedUser> & { password?: string }): Promise<ManagedUser> {
    const { data } = await api.put(`/api/v1/users/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/users/${id}`)
  },
}
