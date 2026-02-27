import api from './api'
import type { Invoice, PaginatedResponse } from '@/types/models'

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const { data } = await api.get('/api/v1/invoice?per_page=10000')
    return data.results
  },

  async getPage(params: { page?: number; perPage?: number } = {}): Promise<PaginatedResponse<Invoice>> {
    const { page = 1, perPage = 25 } = params
    const { data } = await api.get(`/api/v1/invoice?page=${page}&per_page=${perPage}`)
    return data
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

  async sendEmail(invoiceId: number, pdfBlob: Blob, filename: string): Promise<void> {
    const formData = new FormData()
    formData.append('pdf', pdfBlob, filename)
    await api.post(`/api/v1/invoice/${invoiceId}/send`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
