import { useAuth } from '../contexts/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { BarChart3, TrendingUp, DollarSign, Shield, Star } from 'lucide-react'

const SimpleLandingPage = () => {
  const { isAuthenticated } = useAuth()

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold">TradePulse</span>
            </div>
            <div className="space-x-4">
              <Link
                to="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Master Trading with
            <span className="text-blue-500"> $100,000</span> Virtual Money
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Practice trading stocks with real market data in a risk-free environment. 
            Perfect for beginners and experienced traders looking to test new strategies.
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              to="/auth"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Start Trading Now - Free $100K
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose TradePulse?</h2>
            <p className="text-xl text-gray-400">Everything you need to learn trading</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-800 p-6 rounded-xl">
              <DollarSign className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">$100K Starting Balance</h3>
              <p className="text-gray-400">Begin with virtual money to practice without financial risk</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl">
              <TrendingUp className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real Market Data</h3>
              <p className="text-gray-400">Live stock prices and market information</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl">
              <Shield className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Risk-Free Learning</h3>
              <p className="text-gray-400">Learn trading strategies without losing real money</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl">
              <Star className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Portfolio Analytics</h3>
              <p className="text-gray-400">Track performance with detailed charts and reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Trading?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users learning to trade with TradePulse. 
            Sign up now and get your $100,000 virtual portfolio instantly.
          </p>
          
          <Link
            to="/auth"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
          >
            Create Free Account
          </Link>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">$100,000</div>
              <div className="text-gray-400">Virtual Starting Balance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">Real-Time</div>
              <div className="text-gray-400">Market Data</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">100% Free</div>
              <div className="text-gray-400">No Hidden Costs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2025 TradePulse. All rights reserved. Virtual trading platform for educational purposes.</p>
        </div>
      </footer>
    </div>
  )
}

export default SimpleLandingPage
