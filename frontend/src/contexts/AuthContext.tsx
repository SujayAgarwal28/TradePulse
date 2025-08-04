/**
 * Authentication context and hook for TradePulse frontend
 * Manages user authentication state, login, logout, and token storage.
 */
import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { API_BASE_URL, retryBackendConnection, initializeBackendURL, config } from '../config/environment'

interface User {
  id: number
  email: string
  is_active: boolean
  created_at: string
  portfolio_id?: number
  cash_balance?: number
  total_value?: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      setToken(savedToken)
      // Verify token and get user info
      verifyTokenAndGetUser(savedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyTokenAndGetUser = async (authToken: string) => {
    try {
      // Use current backend URL from config
      const backendURL = config.api.baseURL
      
      const response = await fetch(`${backendURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        mode: 'cors'
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setToken(authToken)
      } else {
        // Token is invalid
        localStorage.removeItem('authToken')
        setToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('authToken')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Initialize backend URL detection first
      const backendURL = await initializeBackendURL()
      console.log('🎯 Using backend URL for login:', backendURL)
      
      const formData = new FormData()
      formData.append('username', email) // FastAPI OAuth2PasswordRequestForm expects 'username'
      formData.append('password', password)

      const response = await fetch(`${backendURL}/auth/login`, {
        method: 'POST',
        body: formData,
        credentials: 'omit',
        mode: 'cors'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
      }

      const data = await response.json()
      const { access_token } = data

      // Save token and get user info
      localStorage.setItem('authToken', access_token)
      await verifyTokenAndGetUser(access_token)
    } catch (error) {
      console.error('Login error:', error)
      
      // BULLETPROOF: If login fails, try to retry backend connection
      console.log('🔄 Attempting backend connection retry...')
      const retrySuccess = await retryBackendConnection()
      
      if (retrySuccess) {
        console.log('✅ Backend connection restored, please try login again')
        throw new Error('Backend connection restored. Please try logging in again.')
      } else {
        console.error('🚨 Backend connection retry failed')
        throw new Error('Unable to connect to server. Please check your network connection and try again.')
      }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Registration failed')
      }

      // After successful registration, automatically log in
      await login(email, password)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    if (token) {
      await verifyTokenAndGetUser(token)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// HOC for protected routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white text-xl">Please log in to access this page.</div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
