import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, Newspaper, BarChart3, Globe } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    dayChange: 0,
    dayChangePercent: 0,
    cashBalance: 0
  })

  // Fetch portfolio data
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await api.get('/dashboard/portfolio')

        if (response.status === 200) {
          const data = response.data
          setPortfolioStats({
            totalValue: data.total_portfolio_value || 0,
            dayChange: data.day_change || 0,
            dayChangePercent: data.day_change_percent || 0,
            cashBalance: data.cash_balance || 0
          })
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error)
        // Set fallback values
        setPortfolioStats({
          totalValue: 100000,
          dayChange: 0,
          dayChangePercent: 0,
          cashBalance: 100000
        })
      }
    }

    fetchPortfolio()
  }, [])

  // Mock market data - will be replaced with real API calls
  const [topGainers] = useState([
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 5.23, changePercent: 3.08 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2840.12, change: 45.67, changePercent: 1.63 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: 12.30, changePercent: 5.20 },
  ])

  const [topLosers] = useState([
    { symbol: 'META', name: 'Meta Platforms', price: 298.15, change: -8.45, changePercent: -2.75 },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 445.20, change: -12.80, changePercent: -2.79 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 102.45, change: -3.25, changePercent: -3.07 },
  ])

  const [marketNews] = useState([
    {
      id: 1,
      title: "Fed Signals Potential Rate Cut in Coming Months",
      summary: "Federal Reserve officials hint at monetary policy shifts affecting market outlook...",
      source: "Financial Times",
      time: "2 hours ago"
    },
    {
      id: 2,
      title: "Tech Stocks Rally on AI Breakthrough Announcements",
      summary: "Major technology companies report significant advances in artificial intelligence...",
      source: "Wall Street Journal",
      time: "4 hours ago"
    },
    {
      id: 3,
      title: "Energy Sector Sees Unexpected Surge in Trading Volume",
      summary: "Oil and gas companies experience heightened investor interest amid supply concerns...",
      source: "Reuters",
      time: "6 hours ago"
    }
  ])

  const [marketOverview] = useState({
    dow: { value: 34825.43, change: 156.22, changePercent: 0.45 },
    sp500: { value: 4456.78, change: 23.45, changePercent: 0.53 },
    nasdaq: { value: 13845.12, change: 89.67, changePercent: 0.65 }
  })

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.email}!</h1>
        <p className="text-blue-100">Here's your market overview and portfolio summary</p>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-white">${portfolioStats.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Cash Balance</p>
              <p className="text-2xl font-bold text-white">${portfolioStats.cashBalance.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Day's Change</p>
              <p className={`text-2xl font-bold ${portfolioStats.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${portfolioStats.dayChange.toFixed(2)}
              </p>
            </div>
            {portfolioStats.dayChange >= 0 ? 
              <TrendingUp className="w-8 h-8 text-green-500" /> : 
              <TrendingDown className="w-8 h-8 text-red-500" />
            }
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Day's Change %</p>
              <p className={`text-2xl font-bold ${portfolioStats.dayChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioStats.dayChangePercent.toFixed(2)}%
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Indices */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">Market Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Dow Jones</span>
              <div className="text-right">
                <span className="text-white font-semibold">{marketOverview.dow.value.toLocaleString()}</span>
                <span className={`ml-2 text-sm ${marketOverview.dow.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  +{marketOverview.dow.change} ({marketOverview.dow.changePercent}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">S&P 500</span>
              <div className="text-right">
                <span className="text-white font-semibold">{marketOverview.sp500.value.toLocaleString()}</span>
                <span className={`ml-2 text-sm ${marketOverview.sp500.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  +{marketOverview.sp500.change} ({marketOverview.sp500.changePercent}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">NASDAQ</span>
              <div className="text-right">
                <span className="text-white font-semibold">{marketOverview.nasdaq.value.toLocaleString()}</span>
                <span className={`ml-2 text-sm ${marketOverview.nasdaq.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  +{marketOverview.nasdaq.change} ({marketOverview.nasdaq.changePercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Market News */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Newspaper className="w-5 h-5 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">Market News</h2>
          </div>
          <div className="space-y-4">
            {marketNews.map((news) => (
              <div key={news.id} className="border-b border-slate-700 pb-4 last:border-b-0">
                <h3 className="text-white font-medium text-sm mb-1">{news.title}</h3>
                <p className="text-gray-400 text-xs mb-2">{news.summary}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold">Top Gainers</h2>
          </div>
          <div className="space-y-3">
            {topGainers.map((stock) => (
              <div key={stock.symbol} className="flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold">{stock.symbol}</span>
                  <span className="text-gray-400 text-sm ml-2">{stock.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white">${stock.price}</div>
                  <div className="text-green-500 text-sm">+{stock.change} ({stock.changePercent}%)</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold">Top Losers</h2>
          </div>
          <div className="space-y-3">
            {topLosers.map((stock) => (
              <div key={stock.symbol} className="flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold">{stock.symbol}</span>
                  <span className="text-gray-400 text-sm ml-2">{stock.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white">${stock.price}</div>
                  <div className="text-red-500 text-sm">{stock.change} ({stock.changePercent}%)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
