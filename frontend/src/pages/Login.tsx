import { useState } from 'react'
import { BarChart3, Mail, Lock, User } from 'lucide-react'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLogin) {
      alert('Login functionality will be implemented with backend integration')
    } else {
      alert('Registration functionality will be implemented with backend integration')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <BarChart3 className="w-12 h-12 text-finance-accent" />
            <span className="text-3xl font-bold text-white">TradePulse</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-gray-400">
            {isLogin ? 'Welcome back to your trading dashboard' : 'Start your paper trading journey'}
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-finance-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-finance-accent focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-finance-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-finance-accent focus:outline-none"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-finance-accent focus:ring-finance-accent border-gray-600 bg-finance-dark rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>
                <button type="button" className="text-sm text-finance-accent hover:text-blue-400">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-finance-accent hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-finance-accent transition-colors"
            >
              <User className="w-5 h-5 mr-2" />
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-finance-accent hover:text-blue-400 text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="bg-finance-accent bg-opacity-10 border border-finance-accent rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-finance-accent" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-finance-accent">Demo Mode</h3>
              <div className="mt-1 text-sm text-gray-300">
                This is a paper trading platform. All trades are simulated and no real money is involved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
