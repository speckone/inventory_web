import api from './api'
import type { InvoiceItem, PaginatedResponse } from '@/types/models'

export const invoiceItemService = {
  async getAll(): Promise<InvoiceItem[]> {
    const { data } = await api.get('/api/v1/invoiceitem?per_page=10000')
    return data.results
  },

  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<InvoiceItem>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/invoiceitem?page=${page}&per_page=${perPage}`)
    return data
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
