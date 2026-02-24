import api from './api'
import type { InvoiceItemTemplate, PaginatedResponse } from '@/types/models'

export const invoiceItemTemplateService = {
  async getAll(): Promise<InvoiceItemTemplate[]> {
    const { data } = await api.get('/api/v1/invoiceitemtemplate?per_page=10000')
    return data.results
  },

  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<InvoiceItemTemplate>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/invoiceitemtemplate?page=${page}&per_page=${perPage}`)
    return data
  },

  async create(body: Partial<InvoiceItemTemplate>): Promise<InvoiceItemTemplate> {
    const { data } = await api.post('/api/v1/invoiceitemtemplate', body)
    return data
  },

  async update(id: number, body: Partial<InvoiceItemTemplate>): Promise<InvoiceItemTemplate> {
    const { data } = await api.put(`/api/v1/invoiceitemtemplate/${id}`, body)
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/invoiceitemtemplate/${id}`)
  },
}
