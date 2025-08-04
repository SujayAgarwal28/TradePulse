import axios from 'axios'
import { API_BASE_URL } from '../config/environment'

// Base API configuration - automatically detects environment
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      username: email, // FastAPI OAuth2PasswordRequestForm expects 'username'
      password,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
    })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Profile Management (Phase 2B)
  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  updateProfile: async (profileData: {
    username?: string
    full_name?: string
    bio?: string
    profile_picture_url?: string
  }) => {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  },

  getPreferences: async () => {
    const response = await api.get('/auth/preferences')
    return response.data
  },

  updatePreferences: async (preferences: {
    theme?: 'dark' | 'light'
    email_notifications?: boolean
  }) => {
    const response = await api.put('/auth/preferences', preferences)
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },

  resetPortfolio: async () => {
    const response = await api.post('/auth/reset-portfolio', {
      confirmation: true,
      reset_message: 'reset my portfolio',
    })
    return response.data
  },
}

// Stocks API
export const stocksAPI = {
  search: async (query: string) => {
    const response = await api.get(`/stocks/search?q=${encodeURIComponent(query)}`)
    return response.data
  },

  getStockInfo: async (symbol: string) => {
    const response = await api.get(`/stocks/${symbol}`)
    return response.data
  },

  getStockHistory: async (symbol: string, period: string = '1mo') => {
    const response = await api.get(`/stocks/${symbol}/history?period=${period}`)
    return response.data
  },

  getMarketMovers: async () => {
    const response = await api.get('/stocks/market/movers')
    return response.data
  },
}

// Trading API
export const tradingAPI = {
  executeTrade: async (symbol: string, quantity: number, orderType: 'buy' | 'sell') => {
    const response = await api.post('/trading/execute', {
      symbol,
      quantity,
      order_type: orderType,
    })
    return response.data
  },

  buyStock: async (symbol: string, quantity: number) => {
    return tradingAPI.executeTrade(symbol, quantity, 'buy')
  },

  sellStock: async (symbol: string, quantity: number) => {
    return tradingAPI.executeTrade(symbol, quantity, 'sell')
  },

  getPortfolio: async () => {
    const response = await api.get('/trading/portfolio')
    return response.data
  },

  getPositions: async () => {
    const response = await api.get('/trading/positions')
    return response.data
  },

  getTradeHistory: async (limit: number = 50) => {
    const response = await api.get(`/trading/history?limit=${limit}`)
    return response.data
  },

  getPortfolioStats: async () => {
    const response = await api.get('/trading/stats')
    return response.data
  },
}

// Portfolio API
export const portfolioAPI = {
  getPortfolioMetrics: async (periodDays: number = 30) => {
    const response = await api.get(`/portfolio/metrics?period_days=${periodDays}`)
    return response.data
  },

  getPortfolioHistory: async (periodDays: number = 30) => {
    const response = await api.get(`/portfolio/history?period_days=${periodDays}`)
    return response.data
  },

  getPortfolioValue: async () => {
    const response = await api.get('/portfolio/value')
    return response.data
  },

  getPortfolioPerformance: async (periodDays: number = 30) => {
    const response = await api.get(`/portfolio/performance?period_days=${periodDays}`)
    return response.data
  },

  getPortfolioSummary: async () => {
    const response = await api.get('/portfolio/summary')
    return response.data
  },
}

// Dashboard API
export const dashboardAPI = {
  getOverview: async () => {
    const response = await api.get('/dashboard/overview')
    return response.data
  },

  getPerformanceData: async () => {
    const response = await api.get('/dashboard/performance')
    return response.data
  },
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
