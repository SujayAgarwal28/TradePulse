import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Activity, 
  ArrowRight,
  CheckCircle,
  Star,
  Play
} from 'lucide-react'

const LandingPage = () => {
  const { isAuthenticated } = useAuth()

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  const [isLogin, setIsLogin] = useState(true)

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8 text-finance-accent" />,
      title: "Real-Time Market Data",
      description: "Get live stock prices and market information powered by Yahoo Finance API"
    },
    {
      icon: <DollarSign className="w-8 h-8 text-finance-green" />,
      title: "Paper Trading",
      description: "Practice trading with $100K virtual money without any real financial risk"
    },
    {
      icon: <Activity className="w-8 h-8 text-finance-accent" />,
      title: "Portfolio Analytics",
      description: "Track your performance with detailed charts and comprehensive analytics"
    },
    {
      icon: <Shield className="w-8 h-8 text-finance-green" />,
      title: "Risk-Free Learning",
      description: "Learn trading strategies and market dynamics in a safe environment"
    }
  ]

  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Student",
      content: "TradePulse helped me understand the stock market before investing real money. The interface is intuitive and the data is accurate.",
      rating: 5
    },
    {
      name: "Sarah Chen", 
      role: "New Investor",
      content: "Perfect for beginners! I practiced for months before making my first real investment. Couldn't be happier with the results.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Finance Teacher",
      content: "I use TradePulse to teach my students. It's an excellent educational tool with professional-grade features.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-finance-dark overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-finance-accent/10 to-finance-green/10"></div>
        
        {/* Navigation */}
        <nav className="relative z-10 bg-finance-card/80 backdrop-blur-sm border-b border-gray-700">
          <div className="w-full max-w-full px-4 sm:px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-finance-accent" />
                <span className="text-xl font-bold text-white">TradePulse</span>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsLogin(true)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => setIsLogin(false)}
                  className="bg-finance-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 pt-20 pb-32">
          <div className="w-full max-w-full px-4 sm:px-6 overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Column - Hero Text */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                    Master Trading
                    <span className="text-finance-accent block">Risk-Free</span>
                  </h1>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Learn to trade stocks with real market data and $100K virtual money. 
                    Perfect your strategies before risking real capital.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setIsLogin(false)}
                    className="bg-finance-accent hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <span>Start Trading Free</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button className="border border-gray-600 hover:border-finance-accent text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center justify-center space-x-2 transition-colors">
                    <Play className="w-5 h-5" />
                    <span>Watch Demo</span>
                  </button>
                </div>

                <div className="flex items-center space-x-8 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-finance-green" />
                    <span>No Credit Card Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-finance-green" />
                    <span>Free Forever</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Auth Form */}
              <div className="lg:pl-12">
                <div className="bg-finance-card rounded-2xl shadow-2xl p-8 border border-gray-700">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {isLogin ? 'Welcome Back' : 'Join TradePulse'}
                    </h2>
                    <p className="text-gray-400">
                      {isLogin ? 'Sign in to your account' : 'Create your free account'}
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
                          className="w-full px-4 py-3 bg-finance-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-finance-accent focus:outline-none transition-colors"
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
                        className="w-full px-4 py-3 bg-finance-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-finance-accent focus:outline-none transition-colors"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-finance-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-finance-accent focus:outline-none transition-colors"
                        placeholder="Enter your password"
                      />
                    </div>

                    {isLogin && (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-finance-accent focus:ring-finance-accent border-gray-600 bg-finance-dark rounded"
                          />
                          <span className="text-sm text-gray-300">Remember me</span>
                        </label>
                        <button type="button" className="text-sm text-finance-accent hover:text-blue-400 transition-colors">
                          Forgot password?
                        </button>
                      </div>
                    )}

                    <Link to="/dashboard">
                      <button
                        type="button"
                        className="w-full bg-finance-accent hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                      >
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </button>
                    </Link>

                    <div className="text-center">
                      <span className="text-gray-400">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="ml-2 text-finance-accent hover:text-blue-400 font-semibold transition-colors"
                      >
                        {isLogin ? 'Sign up' : 'Sign in'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-finance-card/30 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Learn Trading
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              TradePulse combines real market data with risk-free virtual trading to provide 
              the ultimate learning experience for aspiring traders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-finance-card rounded-xl p-6 border border-gray-700 hover:border-finance-accent transition-colors">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-finance-accent">$100K</div>
              <div className="text-gray-300">Virtual Starting Capital</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-finance-green">Real-Time</div>
              <div className="text-gray-300">Market Data</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-finance-accent">100%</div>
              <div className="text-gray-300">Risk-Free Learning</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-finance-card/30 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by Thousands of Learners
            </h2>
            <p className="text-xl text-gray-300">
              See what our users say about their TradePulse experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-finance-card rounded-xl p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6">
          <div className="bg-gradient-to-r from-finance-accent to-finance-green rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Your Trading Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are mastering the stock market with TradePulse. 
              No risk, no fees, just pure learning.
            </p>
            <Link to="/dashboard">
              <button className="bg-white text-finance-accent hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                Start Trading for Free
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-finance-card border-t border-gray-700 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BarChart3 className="w-6 h-6 text-finance-accent" />
              <span className="text-lg font-bold text-white">TradePulse</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 TradePulse. All rights reserved. Built for educational purposes.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
