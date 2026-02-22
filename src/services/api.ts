import axios from 'axios'
import type { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user?.access_token) {
          config.headers.Authorization = `Bearer ${user.access_token}`
        }
      } catch {
        localStorage.removeItem('user')
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axios(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const userStr = localStorage.getItem('user')
      if (!userStr) {
        isRefreshing = false
        redirectToLogin()
        return Promise.reject(error)
      }

      let user
      try {
        user = JSON.parse(userStr)
      } catch {
        isRefreshing = false
        localStorage.removeItem('user')
        redirectToLogin()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/auth/refresh`,
          null,
          { headers: { Authorization: `Bearer ${user.refresh_token}` } }
        )
        user.access_token = data.access_token
        localStorage.setItem('user', JSON.stringify(user))
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        processQueue(null, data.access_token)
        return axios(originalRequest)
      } catch (err) {
        processQueue(err, null)
        redirectToLogin()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 401 && originalRequest?._retry) {
      redirectToLogin()
    }

    return Promise.reject(error)
  }
)

function redirectToLogin() {
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export default api
