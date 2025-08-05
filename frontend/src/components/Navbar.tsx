import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Home, TrendingUp, Wallet, User, Settings, LogOut, Users } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import MobileNav from './MobileNav'

const Navbar = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="bg-finance-card shadow-lg w-full overflow-x-hidden sticky top-0 z-[1000]">
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
      {/* Desktop Navigation */}
      <div className="hidden md:block w-full max-w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <BarChart3 className="w-8 h-8 text-finance-accent" />
            <span className="text-xl font-bold text-white">TradePulse</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-4 lg:space-x-8 flex-shrink-0">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-finance-accent text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden lg:inline">Dashboard</span>
            </Link>

            <Link
              to="/trading"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/trading') 
                  ? 'bg-finance-accent text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden lg:inline">Trading</span>
            </Link>

            <Link
              to="/portfolio"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/portfolio') 
                  ? 'bg-finance-accent text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden lg:inline">Portfolio</span>
            </Link>

            <Link
              to="/social"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/social') 
                  ? 'bg-finance-accent text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">Social</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="relative flex items-center space-x-2 flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.email?.split('@')[0] || 'User'}</span>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-md shadow-xl border border-gray-700 py-1"
                style={{
                  position: 'fixed',
                  top: '64px', // Height of navbar + some margin
                  right: '16px', // Small margin from right edge
                  zIndex: 9999,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                }}
              >
                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                  <span>Profile & Settings</span>
                </Link>
                <hr className="my-1 border-gray-700" />
                <button
                  onClick={() => {
                    logout()
                    setIsProfileOpen(false)
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
