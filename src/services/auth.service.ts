import api from './api'
import type { User } from '@/types/models'

export const authService = {
  async login(username: string, password: string): Promise<User> {
    const { data } = await api.post('/auth/login', { username, password })
    if (data.access_token) {
      // If backend doesn't return user.name, use username
      if (!data.name) {
        data.name = username
      }
      localStorage.setItem('user', JSON.stringify(data))
    }
    return data
  },

  logout(): void {
    localStorage.removeItem('user')
  },

  async refresh(): Promise<User> {
    const userStr = localStorage.getItem('user')
    if (!userStr) throw new Error('No user session')
    const user = JSON.parse(userStr)
    const { data } = await api.post('/auth/refresh', null, {
      headers: { Authorization: `Bearer ${user.refresh_token}` },
    })
    if (data.access_token) {
      user.access_token = data.access_token
      localStorage.setItem('user', JSON.stringify(user))
    }
    return user
  },
}
