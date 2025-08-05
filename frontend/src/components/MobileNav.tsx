import { Link, useLocation } from 'react-router-dom'
import { Home, TrendingUp, Wallet, Users } from 'lucide-react'
import { useState } from 'react'

const MobileNav = () => {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="md:hidden w-full">
      <div className="flex justify-between items-center px-4 py-2 bg-finance-card shadow-lg">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-lg font-bold text-white">TradePulse</span>
        </Link>
        <button
          className="text-white focus:outline-none"
          onClick={() => setOpen(!open)}
          aria-label="Open navigation menu"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="flex flex-col bg-finance-card border-t border-gray-700 px-4 pb-2 animate-fade-in z-50">
          <Link
            to="/dashboard"
            className={`flex items-center space-x-2 py-3 px-2 rounded-md text-base font-medium transition-colors ${isActive('/dashboard') ? 'bg-finance-accent text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
            onClick={() => setOpen(false)}
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/trading"
            className={`flex items-center space-x-2 py-3 px-2 rounded-md text-base font-medium transition-colors ${isActive('/trading') ? 'bg-finance-accent text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
            onClick={() => setOpen(false)}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Trading</span>
          </Link>
          <Link
            to="/portfolio"
            className={`flex items-center space-x-2 py-3 px-2 rounded-md text-base font-medium transition-colors ${isActive('/portfolio') ? 'bg-finance-accent text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
            onClick={() => setOpen(false)}
          >
            <Wallet className="w-5 h-5" />
            <span>Portfolio</span>
          </Link>
          <Link
            to="/social"
            className={`flex items-center space-x-2 py-3 px-2 rounded-md text-base font-medium transition-colors ${isActive('/social') ? 'bg-finance-accent text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
            onClick={() => setOpen(false)}
          >
            <Users className="w-5 h-5" />
            <span>Social</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default MobileNav
