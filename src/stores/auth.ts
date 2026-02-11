import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'
import router from '@/router'
import type { User } from '@/types/models'

interface AuthState {
  user: User | null
  status: {
    loggingIn?: boolean
    loggedIn?: boolean
  }
}

const storedUser = localStorage.getItem('user')

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: storedUser ? (JSON.parse(storedUser)).user : null,
    status: storedUser ? { loggedIn: true } : {},
  }),

  getters: {
    loggedIn: (state) => !!state.status.loggedIn,
    userName: (state) => state.user?.name ?? null,
    userRole: (state) => state.user?.role ?? null,
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    async login(username: string, password: string) {
      this.status = { loggingIn: true }
      this.user = { name: username } as User
      try {
        const user = await authService.login(username, password)
        this.status = { loggedIn: true }
        this.user = user
        router.push('/')
      } catch (error) {
        this.status = {}
        this.user = null
        throw error
      }
    },

    logout() {
      authService.logout()
      this.status = {}
      this.user = null
    },
  },
})
