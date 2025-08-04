import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { BarChart3, TrendingUp, DollarSign, Shield } from 'lucide-react'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { login, register, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password)
        setSuccess('Account created successfully! You are now logged in with $100,000 virtual money.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold">TradePulse</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left side - Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 items-center">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">Start Trading Today</h1>
            <p className="text-xl mb-8 text-blue-100">
              Practice trading with $100,000 virtual money. Learn the markets without any real financial risk.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                <span>$100,000 starting balance</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span>Real-time market data</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-green-400" />
                <span>Risk-free learning environment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400 mt-2">
                  {isLogin 
                    ? 'Sign in to your trading account' 
                    : 'Start your trading journey with $100K'
                  }
                </p>
              </div>

              {error && (
                <div className="bg-red-500 text-white p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500 text-white p-3 rounded-lg mb-4 text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  {!isLogin && (
                    <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  {loading 
                    ? 'Processing...' 
                    : isLogin ? 'Sign In' : 'Create Account & Get $100K'
                  }
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : 'Already have an account? Sign in'
                  }
                </button>
              </div>

              {!isLogin && (
                <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-400 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">What you get:</span>
                  </div>
                  <ul className="text-sm text-green-200 space-y-1">
                    <li>• $100,000 virtual trading balance</li>
                    <li>• Real-time stock market data</li>
                    <li>• Portfolio tracking and analytics</li>
                    <li>• Risk-free learning environment</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
