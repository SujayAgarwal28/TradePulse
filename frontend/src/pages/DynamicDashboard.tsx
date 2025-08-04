import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Globe, Plus, X, Star, Newspaper, Activity, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
// import { useAuth } from '../contexts/AuthContext'
import { dashboardService } from '../services/dashboardService'
import type { MarketMover, MarketIndices, PortfolioSummary, NewsItem, MarketStatus, StockQuote } from '../services/dashboardService'

interface WatchlistItem {
  symbol: string
  name?: string
  price: number
  change: number
  changePercent: number
  volume?: number
}

const DynamicDashboard = () => {
  // We'll keep this for potential future use but comment it out for now
  // const { user } = useAuth()
  
  // State for all dashboard data
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [topGainers, setTopGainers] = useState<MarketMover[]>([])
  const [topLosers, setTopLosers] = useState<MarketMover[]>([])
  const [marketIndices, setMarketIndices] = useState<MarketIndices[]>([])
  const [marketNews, setMarketNews] = useState<NewsItem[]>([])
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [popularStocks, setPopularStocks] = useState<StockQuote[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newSymbol, setNewSymbol] = useState('')
  const [showAddSymbol, setShowAddSymbol] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('tradepulse_watchlist')
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist))
      } catch (error) {
        console.error('Error parsing saved watchlist:', error)
        localStorage.removeItem('tradepulse_watchlist')
      }
    }
  }, [])

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)
      console.log('🚀 Starting dashboard data fetch...')
      
      // Fetch all data in parallel for better performance
      const [
        portfolioData,
        marketMovers,
        indices,
        news,
        status,
        popular
      ] = await Promise.all([
        dashboardService.getPortfolioSummary(),
        dashboardService.getMarketMovers(),
        dashboardService.getMarketIndices(),
        dashboardService.getMarketNews(),
        dashboardService.getMarketStatus(),
        dashboardService.getPopularStocks()
      ])

      console.log('📊 Dashboard data fetched:', {
        portfolioData,
        marketMovers,
        indices: indices.length,
        news: news.length,
        status,
        popular: popular.length
      })

      // Update state with fetched data
      setPortfolioSummary(portfolioData)
      setTopGainers(marketMovers.gainers)
      setTopLosers(marketMovers.losers)
      setMarketIndices(indices)
      setMarketNews(news)
      setMarketStatus(status)
      setPopularStocks(popular)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try refreshing.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Update watchlist prices
  const updateWatchlistPrices = useCallback(async () => {
    if (watchlist.length === 0) return

    try {
      const symbols = watchlist.map(item => item.symbol)
      const quotes = await dashboardService.updateWatchlistPrices(symbols)
      
      const updatedWatchlist = watchlist.map(item => {
        const quote = quotes[item.symbol]
        if (quote) {
          return {
            symbol: item.symbol,
            name: quote.name,
            price: quote.current_price,
            change: quote.change,
            changePercent: quote.change_percent,
            volume: quote.volume
          }
        }
        return item
      })
      
      setWatchlist(updatedWatchlist)
      localStorage.setItem('tradepulse_watchlist', JSON.stringify(updatedWatchlist))
    } catch (error) {
      console.error('Error updating watchlist:', error)
    }
  }, [watchlist])

  // Initial data load
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData()
      updateWatchlistPrices()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchDashboardData, updateWatchlistPrices])

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchDashboardData(),
      updateWatchlistPrices()
    ])
  }

  // Add symbol to watchlist
  const addToWatchlist = async () => {
    if (!newSymbol.trim()) return

    try {
      const searchResults = await dashboardService.searchStock(newSymbol.trim())
      
      if (searchResults.length > 0) {
        const stock = searchResults[0]
        const newWatchlistItem: WatchlistItem = {
          symbol: stock.symbol,
          name: stock.name,
          price: stock.current_price,
          change: stock.change,
          changePercent: stock.change_percent,
          volume: stock.volume
        }

        // Check if symbol already exists
        if (watchlist.some(item => item.symbol === stock.symbol)) {
          setError('Symbol already in watchlist')
          return
        }

        const updatedWatchlist = [...watchlist, newWatchlistItem]
        setWatchlist(updatedWatchlist)
        localStorage.setItem('tradepulse_watchlist', JSON.stringify(updatedWatchlist))
        setNewSymbol('')
        setShowAddSymbol(false)
        setError(null)
      } else {
        setError('Stock symbol not found. Please try a different symbol.')
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      setError('Error adding symbol. Please try again.')
    }
  }

  // Remove from watchlist
  const removeFromWatchlist = (symbolToRemove: string) => {
    const updatedWatchlist = watchlist.filter(item => item.symbol !== symbolToRemove)
    setWatchlist(updatedWatchlist)
    localStorage.setItem('tradepulse_watchlist', JSON.stringify(updatedWatchlist))
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-xl">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with refresh */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {lastUpdate && (
              <p className="text-slate-400 text-sm mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-100">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Market Status */}
        {marketStatus && (
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${marketStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-lg font-semibold">
                  {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </div>
              <div className="text-slate-400">
                {marketStatus.isOpen ? marketStatus.nextClose : marketStatus.nextOpen}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Summary */}
        {portfolioSummary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolioSummary.total_value)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Day Change</p>
                  <p className={`text-2xl font-bold ${portfolioSummary.day_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(portfolioSummary.day_change)}
                  </p>
                  <p className={`text-sm ${portfolioSummary.day_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(portfolioSummary.day_change_percent)}
                  </p>
                </div>
                {portfolioSummary.day_change >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500" />
                )}
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Cash Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolioSummary.cash_balance)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Positions Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolioSummary.stock_value)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total P&L</p>
                  <p className={`text-2xl font-bold ${portfolioSummary.total_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(portfolioSummary.total_return)}
                  </p>
                  <p className={`text-sm ${portfolioSummary.total_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(portfolioSummary.total_return_percent)}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Market Indices */}
        {marketIndices.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Market Indices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketIndices.map((index) => (
                <div key={index.symbol} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{index.symbol}</span>
                    <span className={`text-sm ${index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(index.changePercent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-bold">{formatNumber(index.price)}</span>
                    <span className={`text-sm ${index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {index.change >= 0 ? '+' : ''}{formatNumber(index.change)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Movers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-green-500">
              <TrendingUp className="w-5 h-5 mr-2" />
              Top Gainers
            </h2>
            {topGainers.length > 0 ? (
              <div className="space-y-3">
                {topGainers.slice(0, 5).map((stock) => (
                  <div key={stock.symbol} className="flex justify-between items-center bg-slate-700 rounded-lg p-3">
                    <div>
                      <span className="font-semibold">{stock.symbol}</span>
                      {stock.name && <p className="text-sm text-slate-400">{stock.name}</p>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(stock.current_price)}</div>
                      <div className="text-green-500 text-sm">+{formatPercentage(stock.change_percent)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No gainers data available</p>
            )}
          </div>

          {/* Top Losers */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-red-500">
              <TrendingDown className="w-5 h-5 mr-2" />
              Top Losers
            </h2>
            {topLosers.length > 0 ? (
              <div className="space-y-3">
                {topLosers.slice(0, 5).map((stock) => (
                  <div key={stock.symbol} className="flex justify-between items-center bg-slate-700 rounded-lg p-3">
                    <div>
                      <span className="font-semibold">{stock.symbol}</span>
                      {stock.name && <p className="text-sm text-slate-400">{stock.name}</p>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(stock.current_price)}</div>
                      <div className="text-red-500 text-sm">{formatPercentage(stock.change_percent)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No losers data available</p>
            )}
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Star className="w-5 h-5 mr-2" />
              My Watchlist
            </h2>
            <button
              onClick={() => setShowAddSymbol(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {showAddSymbol && (
            <div className="mb-4 flex space-x-2">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="Enter symbol (e.g., AAPL)"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
              />
              <button
                onClick={addToWatchlist}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddSymbol(false)
                  setNewSymbol('')
                  setError(null)
                }}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {watchlist.length > 0 ? (
            <div className="space-y-3">
              {watchlist.map((item) => (
                <div key={item.symbol} className="flex justify-between items-center bg-slate-700 rounded-lg p-3">
                  <div>
                    <span className="font-semibold">{item.symbol}</span>
                    {item.name && <p className="text-sm text-slate-400">{item.name}</p>}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(item.price)}</div>
                      <div className={`text-sm ${item.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercentage(item.changePercent)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(item.symbol)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No stocks in watchlist. Add some to get started!</p>
          )}
        </div>

        {/* Market News */}
        {marketNews.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Newspaper className="w-5 h-5 mr-2" />
              Market News
            </h2>
            <div className="space-y-4">
              {marketNews.map((article, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{article.title}</h3>
                    <span className="text-slate-400 text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(article.publishedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-3">{article.summary}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{article.source}</span>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                    >
                      Read more →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Stocks */}
        {popularStocks.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Popular Stocks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularStocks.slice(0, 6).map((stock) => (
                <div key={stock.symbol} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{stock.symbol}</span>
                    <span className={`text-sm ${stock.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(stock.change_percent)}
                    </span>
                  </div>
                  {stock.name && <p className="text-sm text-slate-400 mb-2">{stock.name}</p>}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">{formatCurrency(stock.current_price)}</span>
                    {stock.volume && (
                      <span className="text-sm text-slate-400">
                        Vol: {formatNumber(stock.volume)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DynamicDashboard
