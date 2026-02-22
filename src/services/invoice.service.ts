import api from './api'
import type { Invoice } from '@/types/models'

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const { data } = await api.get('/api/v1/invoice?per_page=10000')
    return data.results
  },

  async create(body: Partial<Invoice>): Promise<Invoice> {
    const { data } = await api.post('/api/v1/invoice', body)
    return data.invoice
  },

  async update(id: number, body: Partial<Invoice>): Promise<Invoice> {
    const { data } = await api.put(`/api/v1/invoice/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/invoice/${id}`)
  },
}
