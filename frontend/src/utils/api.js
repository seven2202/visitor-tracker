import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证 token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error

    if (response?.status === 401) {
      // 只有在已登录状态下才清除认证状态和重定向
      const isAuthenticated = useAuthStore.getState().isAuthenticated
      if (isAuthenticated) {
        useAuthStore.getState().logout()
        toast.error('登录已过期，请重新登录')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
      // 如果是登录请求失败，不做重定向，让组件自己处理错误
    } else if (response?.status === 403) {
      toast.error('权限不足')
    } else if (response?.status === 404) {
      toast.error('请求的资源不存在')
    } else if (response?.status >= 500) {
      toast.error('服务器错误，请稍后重试')
    } else if (response?.data?.error) {
      toast.error(response.data.error)
    } else {
      toast.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

// API 方法
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verify: () => api.get('/auth/verify'),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData)
}

export const websitesAPI = {
  getAll: () => api.get('/websites'),
  getById: (id) => api.get(`/websites/${id}`),
  create: (websiteData) => api.post('/websites', websiteData),
  update: (id, websiteData) => api.put(`/websites/${id}`, websiteData),
  delete: (id) => api.delete(`/websites/${id}`),
  regenerateKey: (id) => api.post(`/websites/${id}/regenerate-key`),
  getStats: (id) => api.get(`/websites/${id}/stats`)
}

export const analyticsAPI = {
  getOverview: (websiteId, params) => api.get(`/analytics/overview/${websiteId}`, { params }),
  getTimeseries: (websiteId, params) => api.get(`/analytics/timeseries/${websiteId}`, { params }),
  getGeography: (websiteId, params) => api.get(`/analytics/geography/${websiteId}`, { params }),
  getTechnology: (websiteId, params) => api.get(`/analytics/technology/${websiteId}`, { params })
}

export const trackingAPI = {
  getOnlineUsers: (apiKey) => api.get(`/track/online/${apiKey}`)
}

export default api
