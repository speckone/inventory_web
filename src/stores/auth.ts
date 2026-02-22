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

function parseStoredUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return (JSON.parse(raw)).user ?? null
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

const parsedUser = parseStoredUser()

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: parsedUser,
    status: parsedUser ? { loggedIn: true } : {},
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
        const data = await authService.login(username, password)
        this.status = { loggedIn: true }
        this.user = (data as any).user ?? data
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
