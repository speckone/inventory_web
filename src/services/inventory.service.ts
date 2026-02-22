import api from './api'
import type { InventoryItem } from '@/types/models'

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const { data } = await api.get('/api/v1/inventory?per_page=10000')
    return data.results
  },

  async create(body: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data } = await api.post('/api/v1/inventory', body)
    return data
  },

  async update(id: number, body: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data } = await api.put(`/api/v1/inventory/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/inventory/${id}`)
  },
}
