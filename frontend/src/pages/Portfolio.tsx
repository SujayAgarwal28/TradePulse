import { useState, useEffect } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Activity, Download, FileText, AlertCircle, Calendar, Target, BarChart3, PieChart as PieChartIcon, Loader2 } from 'lucide-react'
import { tradingAPI, portfolioAPI } from '../services/api'
import type { RealPortfolioMetrics } from '../types'

// Types
interface Position {
  symbol: string
  name: string
  quantity: number
  average_cost: number
  current_price: number
  market_value: number
  cost_basis: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
}

interface TradeHistoryItem {
  id: number
  symbol: string
  type: string
  quantity: number
  price: number
  total_amount: number
  fees: number
  status: string
  created_at: string
}

interface PortfolioData {
  portfolio_id: number
  cash_balance: number
  total_market_value: number
  total_portfolio_value: number
  total_unrealized_pnl?: number
  total_unrealized_pnl_percent?: number
  positions: Position[]
  day_change?: number
  day_change_percent?: number
}

const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<RealPortfolioMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [chartData, setChartData] = useState<any[]>([])
  const [isSquaringOff, setIsSquaringOff] = useState<string | null>(null)

  // Load portfolio data
  const loadPortfolioData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load portfolio data first
      const portfolio = await tradingAPI.getPortfolio()
      
      // Convert positions object to array if needed
      let positionsArray: Position[] = []
      if (portfolio.positions) {
        if (Array.isArray(portfolio.positions)) {
          positionsArray = portfolio.positions
        } else {
          // Convert object to array
          positionsArray = Object.values(portfolio.positions)
        }
      }
      
      // Calculate total unrealized P&L from positions
      const totalUnrealizedPnL = positionsArray.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0)
      const totalCostBasis = positionsArray.reduce((sum, pos) => sum + (pos.cost_basis || 0), 0)
      const totalUnrealizedPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0
      
      // Enhanced portfolio data
      const enhancedPortfolio: PortfolioData = {
        ...portfolio,
        positions: positionsArray,
        total_unrealized_pnl: totalUnrealizedPnL,
        total_unrealized_pnl_percent: totalUnrealizedPnLPercent,
        day_change: portfolio.day_change || 0,
        day_change_percent: portfolio.day_change_percent || 0
      }
      
      setPortfolioData(enhancedPortfolio)
      
      // Load other data separately to avoid blocking main portfolio display
      try {
        const trades = await tradingAPI.getTradeHistory(50)
        setTradeHistory(trades)
      } catch (err) {
        console.warn('Failed to load trade history:', err)
      }
      
      try {
        const metrics = await portfolioAPI.getPortfolioMetrics(30)
        setPerformanceMetrics(metrics)
      } catch (err) {
        console.warn('Failed to load performance metrics:', err)
      }

      try {
        const history = await portfolioAPI.getPortfolioHistory(30)
        // Generate chart data from real history
        if (history && history.history) {
          setChartData(history.history.map((point: any) => ({
            date: point.date,
            daily_pnl: point.daily_pnl,
            cumulative_pnl: point.cumulative_pnl,
            portfolio_value: point.portfolio_value
          })))
        }
      } catch (err) {
        console.warn('Failed to load portfolio history:', err)
        // Set default chart data
        setChartData([])
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load portfolio data')
      console.error('Portfolio error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Square off function (sell all shares of a position)
  const handleSquareOff = async (symbol: string, quantity: number) => {
    if (!confirm(`Are you sure you want to square off all ${quantity} shares of ${symbol}?`)) {
      return
    }

    setIsSquaringOff(symbol)
    try {
      await tradingAPI.sellStock(symbol, quantity)
      
      // Refresh portfolio data after successful trade
      await loadPortfolioData()
      
      // Show success message
      alert(`Successfully sold ${quantity} shares of ${symbol}`)
    } catch (error: any) {
      console.error('Square off failed:', error)
      alert(`Square off failed: ${error.response?.data?.detail || error.message || 'Unknown error'}`)
    } finally {
      setIsSquaringOff(null)
    }
  }

  const exportToPDF = async () => {
    if (!portfolioData) return

    try {
      // Dynamic import of jsPDF to avoid bundle issues
      const { default: jsPDF } = await import('jspdf')
      
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.text('TradePulse Portfolio Report', 20, 20)
      
      // Date
      doc.setFontSize(12)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30)
      
      // Portfolio Summary
      doc.setFontSize(16)
      doc.text('Portfolio Summary', 20, 50)
      
      doc.setFontSize(12)
      doc.text(`Total Portfolio Value: $${portfolioData.total_portfolio_value.toLocaleString()}`, 20, 65)
      doc.text(`Cash Balance: $${portfolioData.cash_balance.toLocaleString()}`, 20, 75)
      doc.text(`Total P&L: $${(portfolioData.total_unrealized_pnl || 0).toLocaleString()}`, 20, 85)
      doc.text(`P&L Percentage: ${(portfolioData.total_unrealized_pnl_percent || 0).toFixed(2)}%`, 20, 95)
      
      // Positions
      if (portfolioData.positions.length > 0) {
        doc.setFontSize(16)
        doc.text('Current Positions', 20, 115)
        
        let yPos = 130
        doc.setFontSize(10)
        doc.text('Symbol', 20, yPos)
        doc.text('Quantity', 60, yPos)
        doc.text('Avg Cost', 100, yPos)
        doc.text('Current Price', 140, yPos)
        doc.text('P&L', 180, yPos)
        
        yPos += 10
        
        portfolioData.positions.forEach((position) => {
          doc.text(position.symbol, 20, yPos)
          doc.text(position.quantity.toString(), 60, yPos)
          doc.text(`$${position.average_cost.toFixed(2)}`, 100, yPos)
          doc.text(`$${position.current_price.toFixed(2)}`, 140, yPos)
          doc.text(`$${position.unrealized_pnl.toFixed(2)}`, 180, yPos)
          yPos += 8
          
          if (yPos > 280) {
            doc.addPage()
            yPos = 20
          }
        })
        
        // Performance Metrics
        if (performanceMetrics) {
          if (yPos > 200) {
            doc.addPage()
            yPos = 20
          } else {
            yPos += 20
          }
          
          doc.setFontSize(16)
          doc.text('Performance Metrics', 20, yPos)
          
          yPos += 15
          doc.setFontSize(12)
          doc.text(`Sharpe Ratio: ${performanceMetrics.sharpe_ratio.toFixed(2)}`, 20, yPos)
          doc.text(`Max Drawdown: ${performanceMetrics.max_drawdown.toFixed(1)}%`, 20, yPos + 10)
          doc.text(`Win Rate: ${performanceMetrics.win_rate.toFixed(1)}%`, 20, yPos + 20)
          doc.text(`Volatility: ${performanceMetrics.volatility.toFixed(1)}%`, 20, yPos + 30)
          doc.text(`Total Trades: ${performanceMetrics.total_trades}`, 20, yPos + 40)
          doc.text(`Profitable Trades: ${performanceMetrics.profitable_trades}`, 20, yPos + 50)
        }
      }
      
      // Save the PDF
      doc.save(`portfolio-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF report. Please try again.')
    }
  }

  const exportToCSV = () => {
    if (!portfolioData) return
    
    const csvContent = [
      ['Symbol', 'Name', 'Quantity', 'Avg Cost', 'Current Price', 'Market Value', 'P&L', 'P&L %'],
      ...portfolioData.positions.map(pos => [
        pos.symbol,
        pos.name,
        pos.quantity,
        pos.average_cost,
        pos.current_price,
        pos.market_value,
        pos.unrealized_pnl,
        pos.unrealized_pnl_percent
      ])
    ].map(row => row.join(',')).join('\\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'portfolio.csv'
    a.click()
  }

  useEffect(() => {
    loadPortfolioData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-finance-accent" />
          <p className="text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <div className="card">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-finance-red mr-3" />
            <h3 className="text-lg font-medium text-finance-red">Portfolio Load Error</h3>
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadPortfolioData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!portfolioData) return null

  const pieData = portfolioData.positions.map(pos => ({
    name: pos.symbol,
    value: pos.market_value,
    percentage: ((pos.market_value / portfolioData.total_portfolio_value) * 100).toFixed(1)
  }))

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <div className="flex space-x-2">
          <button
            onClick={exportToPDF}
            className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-white">${portfolioData.total_portfolio_value.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-finance-accent" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Returns</p>
              <p className={`text-2xl font-bold ${(portfolioData.total_unrealized_pnl || 0) >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                ${(portfolioData.total_unrealized_pnl || 0).toLocaleString()}
              </p>
              <p className={`text-sm ${(portfolioData.total_unrealized_pnl || 0) >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                {(portfolioData.total_unrealized_pnl_percent || 0).toFixed(2)}%
              </p>
            </div>
            {(portfolioData.total_unrealized_pnl || 0) >= 0 ? 
              <TrendingUp className="w-8 h-8 text-finance-green" /> : 
              <TrendingDown className="w-8 h-8 text-finance-red" />
            }
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Cash Balance</p>
              <p className="text-2xl font-bold text-white">${portfolioData.cash_balance.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-finance-green" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Positions</p>
              <p className="text-2xl font-bold text-white">{portfolioData.positions.length}</p>
            </div>
            <Target className="w-8 h-8 text-finance-accent" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-finance-dark p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'positions', label: 'Positions', icon: Target },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'allocation', label: 'Allocation', icon: PieChartIcon },
          { id: 'history', label: 'Trade History', icon: Calendar },
        ].map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id 
                  ? 'bg-finance-accent text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <IconComponent className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Performance Chart */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Portfolio Performance (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Area type="monotone" dataKey="portfolio_value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily P&L Chart */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Daily P&L</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="daily_pnl" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'positions' && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Current Positions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Symbol</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Quantity</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Avg Cost</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Current Price</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Market Value</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Unrealized P&L</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">% Change</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.positions.map((position) => (
                  <tr key={position.symbol} className="border-b border-gray-700 hover:bg-finance-dark">
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-semibold text-white">{position.symbol}</span>
                        <p className="text-sm text-gray-400">{position.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{position.quantity}</td>
                    <td className="py-4 px-4 text-gray-300">${position.average_cost.toFixed(2)}</td>
                    <td className="py-4 px-4 text-gray-300">${position.current_price.toFixed(2)}</td>
                    <td className="py-4 px-4 text-white">${position.market_value.toLocaleString()}</td>
                    <td className={`py-4 px-4 font-semibold ${position.unrealized_pnl >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                      ${position.unrealized_pnl.toFixed(2)}
                    </td>
                    <td className={`py-4 px-4 font-semibold ${position.unrealized_pnl_percent >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                      {position.unrealized_pnl_percent >= 0 ? '+' : ''}{position.unrealized_pnl_percent.toFixed(2)}%
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleSquareOff(position.symbol, position.quantity)}
                        disabled={isSquaringOff === position.symbol}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded text-sm font-medium text-white transition-colors"
                      >
                        {isSquaringOff === position.symbol ? 'Selling...' : 'Square Off'}
                      </button>
                    </td>
                  </tr>
                ))}
                {portfolioData.positions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No positions found. Start trading to build your portfolio!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
            {performanceMetrics ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sharpe Ratio</span>
                  <span className="text-white font-semibold">{performanceMetrics.sharpe_ratio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Max Drawdown</span>
                  <span className="text-finance-red font-semibold">{performanceMetrics.max_drawdown.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-finance-green font-semibold">{performanceMetrics.win_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Volatility</span>
                  <span className="text-white font-semibold">{performanceMetrics.volatility.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Beta</span>
                  <span className="text-white font-semibold">{performanceMetrics.beta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Trades</span>
                  <span className="text-white font-semibold">{performanceMetrics.total_trades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Profitable Trades</span>
                  <span className="text-finance-green font-semibold">{performanceMetrics.profitable_trades}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Performance metrics unavailable</p>
                <p className="text-sm text-gray-500 mt-2">Make some trades to see your performance metrics</p>
              </div>
            )}
          </div>

          {/* Risk Analysis */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Risk Analysis</h3>
            {performanceMetrics ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Portfolio Risk Level</span>
                    <span className={`font-semibold ${
                      performanceMetrics.volatility < 15 ? 'text-finance-green' : 
                      performanceMetrics.volatility < 25 ? 'text-yellow-400' : 'text-finance-red'
                    }`}>
                      {performanceMetrics.volatility < 15 ? 'Low' : 
                       performanceMetrics.volatility < 25 ? 'Moderate' : 'High'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        performanceMetrics.volatility < 15 ? 'bg-finance-green' : 
                        performanceMetrics.volatility < 25 ? 'bg-yellow-400' : 'bg-finance-red'
                      }`} 
                      style={{ width: `${Math.min(performanceMetrics.volatility * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Diversification Score</span>
                    <span className={`font-semibold ${
                      portfolioData.positions.length >= 5 ? 'text-finance-green' : 
                      portfolioData.positions.length >= 3 ? 'text-yellow-400' : 'text-finance-red'
                    }`}>
                      {portfolioData.positions.length >= 5 ? 'Good' : 
                       portfolioData.positions.length >= 3 ? 'Fair' : 'Poor'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        portfolioData.positions.length >= 5 ? 'bg-finance-green' : 
                        portfolioData.positions.length >= 3 ? 'bg-yellow-400' : 'bg-finance-red'
                      }`} 
                      style={{ width: `${Math.min(portfolioData.positions.length * 15, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Liquidity Risk</span>
                    <span className="text-finance-green font-semibold">Low</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-finance-green h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Risk analysis unavailable</p>
                <p className="text-sm text-gray-500 mt-2">Performance data needed for risk calculations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'allocation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Portfolio Allocation</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation Details */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Allocation Breakdown</h3>
            <div className="space-y-4">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">${item.value.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Trade History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Symbol</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Quantity</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Price</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Trade Value</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Fees</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Net Cash Impact</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map((trade) => {
                  // Calculate the actual cash impact including fees
                  const netCashImpact = trade.type === 'buy' 
                    ? -(trade.total_amount + trade.fees)  // Buy: cash goes out (negative)
                    : (trade.total_amount - trade.fees)   // Sell: cash comes in (positive)
                  
                  return (
                    <tr key={trade.id} className="border-b border-gray-700 hover:bg-finance-dark">
                      <td className="py-4 px-4 text-gray-300">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-white">{trade.symbol}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          trade.type === 'buy' 
                            ? 'bg-finance-green bg-opacity-20 text-finance-green' 
                            : 'bg-finance-red bg-opacity-20 text-finance-red'
                        }`}>
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{trade.quantity}</td>
                      <td className="py-4 px-4 text-gray-300">${trade.price.toFixed(2)}</td>
                      <td className="py-4 px-4 text-white">${trade.total_amount.toLocaleString()}</td>
                      <td className="py-4 px-4 text-yellow-400">${trade.fees.toFixed(2)}</td>
                      <td className={`py-4 px-4 font-semibold ${netCashImpact >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                        {netCashImpact >= 0 ? '+' : ''}${Math.abs(netCashImpact).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
                {tradeHistory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No trade history found. Start trading to see your activity!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Portfolio Alerts */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-finance-accent/20 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-finance-accent mr-3" />
          <h3 className="text-xl font-semibold">Portfolio Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {performanceMetrics && performanceMetrics.win_rate > 60 && (
            <div className="bg-finance-green/10 border border-finance-green/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-finance-green font-medium">Strong Performance</span>
                <TrendingUp className="w-5 h-5 text-finance-green" />
              </div>
              <p className="text-gray-300 text-sm mt-1">
                {performanceMetrics.win_rate.toFixed(1)}% win rate shows excellent trading decisions
              </p>
            </div>
          )}
          
          {portfolioData.positions.length < 3 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-yellow-500 font-medium">Diversification Opportunity</span>
                <Target className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-gray-300 text-sm mt-1">
                Consider adding more stocks to diversify your portfolio
              </p>
            </div>
          )}
          
          {portfolioData.cash_balance > portfolioData.total_portfolio_value * 0.3 && (
            <div className="bg-finance-accent/10 border border-finance-accent/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-finance-accent font-medium">High Cash Position</span>
                <DollarSign className="w-5 h-5 text-finance-accent" />
              </div>
              <p className="text-gray-300 text-sm mt-1">
                Consider investing ${portfolioData.cash_balance.toLocaleString()} for growth
              </p>
            </div>
          )}
          
          {performanceMetrics && performanceMetrics.avg_holding_period < 1 && performanceMetrics.total_trades > 5 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-orange-500 font-medium">Frequent Trading Alert</span>
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-gray-300 text-sm mt-1">
                Short holding periods detected. Consider longer-term strategies.
              </p>
            </div>
          )}
          
          {(!performanceMetrics || performanceMetrics.total_trades === 0) && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-500 font-medium">Ready to Start</span>
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-gray-300 text-sm mt-1">
                Start trading to build your portfolio and track performance
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Portfolio
