import api from './api'
import type { InvoiceItem } from '@/types/models'

export const invoiceItemService = {
  async getAll(): Promise<InvoiceItem[]> {
    const { data } = await api.get('/api/v1/invoiceitem?per_page=10000')
    return data.results
  },

  async create(body: Partial<InvoiceItem>): Promise<InvoiceItem> {
    const { data } = await api.post('/api/v1/invoiceitem', body)
    return data
  },

  async update(id: number, body: Partial<InvoiceItem>): Promise<InvoiceItem> {
    const { data } = await api.put(`/api/v1/invoiceitem/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/invoiceitem/${id}`)
  },
}
