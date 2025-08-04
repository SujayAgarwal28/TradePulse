import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  DollarSign
} from 'lucide-react'

const SimpleLandingPage = () => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold">TradePulse</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
              <a href="#contact" className="hover:text-blue-400 transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Hero content */}
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Master Trading with
                <span className="text-blue-500"> Virtual Money</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Practice stock trading with real market data and $100,000 virtual money. 
                Learn, experiment, and build confidence before investing real capital.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-center">
                  Start Trading Now
                </Link>
                <button className="border border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-lg font-semibold transition-colors">
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Right side - Auth form */}
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400">
                  {isLogin ? 'Sign in to your account' : 'Start your trading journey'}
                </p>
              </div>

              <form className="space-y-6">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-slate-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-slate-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Learn Trading
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our platform provides all the tools and features you need to master the art of trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Data</h3>
              <p className="text-gray-400">
                Get live stock prices and market information
              </p>
            </div>
            
            <div className="text-center p-6">
              <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Virtual Money</h3>
              <p className="text-gray-400">
                Practice with $100K virtual money
              </p>
            </div>
            
            <div className="text-center p-6">
              <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-gray-400">
                Track performance with detailed charts
              </p>
            </div>
            
            <div className="text-center p-6">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Risk-Free</h3>
              <p className="text-gray-400">
                Learn without any financial risk
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SimpleLandingPage
