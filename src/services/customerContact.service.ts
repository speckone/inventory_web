import api from './api'
import type { CustomerContact } from '@/types/models'

export const customerContactService = {
  async getAll(customerId: number): Promise<CustomerContact[]> {
    const { data } = await api.get(`/api/v1/customer/${customerId}/contact?per_page=10000`)
    return data.results
  },

  async create(customerId: number, body: Partial<CustomerContact>): Promise<CustomerContact> {
    const { data } = await api.post(`/api/v1/customer/${customerId}/contact`, body)
    return data.customer_contact
  },

  async update(customerId: number, contactId: number, body: Partial<CustomerContact>): Promise<CustomerContact> {
    const { data } = await api.put(`/api/v1/customer/${customerId}/contact/${contactId}`, body)
    return data.customer_contact
  },

  async delete(customerId: number, contactId: number): Promise<void> {
    await api.delete(`/api/v1/customer/${customerId}/contact/${contactId}`)
  },
}
