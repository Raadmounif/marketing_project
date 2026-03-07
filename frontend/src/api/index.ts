import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (data: object) => api.post('/register', data),
  login: (data: object) => api.post('/login', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  updateProfile: (data: object) => api.put('/profile', data),
}

// Offers
export const offersApi = {
  list: () => api.get('/offers'),
  get: (id: number) => api.get(`/offers/${id}`),
  create: (data: object) => api.post('/offers', data),
  update: (id: number, data: object) => api.put(`/offers/${id}`, data),
  delete: (id: number) => api.delete(`/offers/${id}`),
}

// Products
export const productsApi = {
  list: (offerId: number, search?: string) =>
    api.get(`/offers/${offerId}/products`, { params: { search } }),
  create: (offerId: number, data: FormData) =>
    api.post(`/offers/${offerId}/products`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: FormData) =>
    api.post(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: number) => api.delete(`/products/${id}`),
  toggle: (id: number) => api.patch(`/products/${id}/toggle`),
  bulkUpdate: (offerId: number, data: object) =>
    api.post(`/offers/${offerId}/products/bulk-update`, data),
}

// Orders
export const ordersApi = {
  create: (data: object) => api.post('/orders', data),
  myOrders: () => api.get('/my-orders'),
  all: () => api.get('/orders'),
  uploadReceipt: (orderId: number, data: FormData) =>
    api.post(`/orders/${orderId}/receipt`, data),
  submitFeedback: (orderId: number, feedback: string) =>
    api.patch(`/orders/${orderId}/feedback`, { feedback }),
  deleteOrder: (orderId: number) => api.delete(`/orders/${orderId}`),
  toggleCommission: (orderId: number) => api.patch(`/orders/${orderId}/commission`),
}

// User management
export const usersApi = {
  list: () => api.get('/users'),
  create: (data: object) => api.post('/users', data),
  delete: (userId: number) => api.delete(`/users/${userId}`),
  resetPassword: (userId: number, data: object) => api.post(`/users/${userId}/reset-password`, data),
}

// Favorites
export const favoritesApi = {
  list: () => api.get('/favorites'),
  add: (productId: number) => api.post('/favorites', { product_id: productId }),
  remove: (productId: number) => api.delete(`/favorites/${productId}`),
}

// Advertising board
export const boardApi = {
  list: () => api.get('/advertising-boards'),
  create: (data: FormData) =>
    api.post('/advertising-boards', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: FormData) =>
    api.put(`/advertising-boards/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: number) => api.delete(`/advertising-boards/${id}`),
}

// How it works
export const hiwApi = {
  list: () => api.get('/how-it-works'),
  create: (data: object) => api.post('/how-it-works', data),
  update: (id: number, data: object) => api.put(`/how-it-works/${id}`, data),
  delete: (id: number) => api.delete(`/how-it-works/${id}`),
}

// Settings (admin)
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: object) => api.put('/settings', data),
}

// Statistics
export const statisticsApi = {
  get: () => api.get('/statistics'),
}

// Notifications
export const notificationsApi = {
  overdue: () => api.get('/notifications/overdue'),
}

export default api
