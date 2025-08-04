import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { Trophy, User } from 'lucide-react'
import { API_BASE_URL } from '../config/environment'

interface StockData {
  symbol: string
  name: string
  current_price: number
  previous_close: number
  change_percent: number
  market_cap?: number
  sector?: string
}

interface TradeRequest {
  symbol: string
  quantity: number
  order_type: 'buy' | 'sell'  // Changed from trade_type to order_type
}

const TradingFixed = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const { isAuthenticated, token } = useAuth()
  const queryClient = useQueryClient()

  // Calculate brokerage charges (0.05% of trade value)
  const calculateBrokerage = (price: number, quantity: number): number => {
    const tradeValue = price * quantity;
    return tradeValue * 0.0005; // 0.05%
  };

  // Calculate total trade cost including brokerage
  const calculateTotalCost = (price: number, quantity: number): number => {
    const tradeValue = price * quantity;
    const brokerage = calculateBrokerage(price, quantity);
    return tradeValue + brokerage;
  };

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  // Fetch popular stocks
  const { data: stockData = [], isLoading: stocksLoading, error: stocksError } = useQuery({
    queryKey: ['popular-stocks'],
    queryFn: async (): Promise<StockData[]> => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META']
      const promises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(`${API_BASE_URL}/stocks/${symbol}`)
          if (!response.ok) throw new Error(`Failed to fetch ${symbol}`)
          const data = await response.json()
          return {
            ...data,
            current_price: parseFloat(data.current_price) || 0,
            previous_close: parseFloat(data.previous_close) || 0,
            change_percent: parseFloat(data.change_percent) || 0,
          }
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error)
          return null
        }
      })
      
      const results = await Promise.all(promises)
      return results.filter((stock): stock is StockData => stock !== null)
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })

  // Search stocks
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['search-stocks', searchTerm],
    queryFn: async (): Promise<any[]> => {
      if (!searchTerm || searchTerm.length < 2) return []
      
      try {
        const response = await fetch(`${API_BASE_URL}/stocks/search?q=${encodeURIComponent(searchTerm)}`)
        if (!response.ok) throw new Error('Search failed')
        const results = await response.json()
        
        // Ensure consistent data structure for search results
        return results.map((stock: any) => ({
          ...stock,
          current_price: parseFloat(stock.current_price) || 0,
          previous_close: parseFloat(stock.previous_close) || 0,
          change_percent: parseFloat(stock.change_percent) || 0,
        }))
      } catch (error) {
        console.error('Search error:', error)
        return []
      }
    },
    enabled: searchTerm.length >= 2,
    staleTime: 300000, // 5 minutes
  })

  // Trading mutation
  const tradeMutation = useMutation({
    mutationFn: async (trade: TradeRequest) => {
      const response = await fetch(`${API_BASE_URL}/trading/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(trade),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Trade failed')
      }
      
      return await response.json()
    },
    onSuccess: (data) => {
      setSuccessMessage(`Successfully ${data.order_type || data.trade_type} ${data.quantity} shares of ${data.symbol}`)
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    onError: (error: Error) => {
      console.error('Trade error:', error)
      alert(`Trade failed: ${error.message}`)
    },
  })

  const handleStockSelect = async (stockSymbol: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/${stockSymbol}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedStock({
          ...data,
          current_price: parseFloat(data.current_price) || 0,
          previous_close: parseFloat(data.previous_close) || 0,
          change_percent: parseFloat(data.change_percent) || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching stock:', error)
    }
  }

  const handleBuy = () => {
    if (!selectedStock) return
    
    tradeMutation.mutate({
      symbol: selectedStock.symbol,
      quantity,
      order_type: 'buy'
    })
  }

  const handleSell = () => {
    if (!selectedStock) return
    
    tradeMutation.mutate({
      symbol: selectedStock.symbol,
      quantity,
      order_type: 'sell'
    })
  }

  const handleQuickBuy = (stock: StockData) => {
    tradeMutation.mutate({
      symbol: stock.symbol,
      quantity: 1,
      order_type: 'buy'
    })
  }

  const displayStocks = searchTerm.length >= 2 ? searchResults : stockData

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-finance-accent to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Trading Dashboard</h1>
        <p className="text-blue-100">Buy and sell stocks with real-time market data</p>
      </div>

      {/* Trading Mode Info */}
      <div className="bg-blue-800 border border-blue-600 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-white">Personal Trading Mode</h3>
              <p className="text-sm text-blue-200">Trading with your personal portfolio</p>
            </div>
          </div>
          <Link
            to="/social"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Join Competition</span>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-500 text-white p-4 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Search */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Search Stocks</h2>
        <input
          type="text"
          placeholder="Search for stocks (e.g., AAPL, Tesla)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-finance-dark border border-gray-600 rounded-lg text-white"
        />
        {searchLoading && <p className="text-gray-400 mt-2">Searching...</p>}
      </div>

      {/* Stock Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stocksLoading && <p className="text-gray-400">Loading stocks...</p>}
        {stocksError && <p className="text-red-400">Error loading stocks</p>}
        
        {displayStocks.map((stock) => (
          <div key={stock.symbol} className="card cursor-pointer hover:bg-finance-accent/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{stock.symbol}</h3>
                <p className="text-gray-400 text-sm">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">
                  ${stock.current_price && typeof stock.current_price === 'number' ? stock.current_price.toFixed(2) : 'N/A'}
                </p>
                <p className={`text-sm ${
                  (stock.change_percent || 0) >= 0 ? 'text-finance-green' : 'text-finance-red'
                }`}>
                  {(stock.change_percent || 0) >= 0 ? '+' : ''}{(stock.change_percent || 0).toFixed(2)}%
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleStockSelect(stock.symbol)}
                className="flex-1 bg-finance-accent hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors"
              >
                Select
              </button>
              <button
                onClick={() => handleQuickBuy(stock)}
                disabled={tradeMutation.isPending}
                className="bg-finance-green hover:bg-green-600 text-white px-3 py-2 rounded transition-colors disabled:opacity-50"
              >
                Quick Buy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trading Panel */}
      {selectedStock && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Trade {selectedStock.symbol}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedStock.name}</h3>
              <p className="text-2xl font-bold text-finance-green mb-2">
                ${selectedStock.current_price && typeof selectedStock.current_price === 'number' ? selectedStock.current_price.toFixed(2) : 'N/A'}
              </p>
              <p className={`text-sm mb-4 ${
                selectedStock.change_percent >= 0 ? 'text-finance-green' : 'text-finance-red'
              }`}>
                {selectedStock.change_percent >= 0 ? '+' : ''}{(selectedStock.change_percent || 0).toFixed(2)}% today
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-finance-dark border border-gray-600 rounded text-white mb-4"
              />

              {/* Order Summary */}
              {selectedStock.current_price && quantity > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2 text-white">Order Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Quantity:</span>
                      <span>{quantity} shares</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Price per share:</span>
                      <span>${selectedStock.current_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal:</span>
                      <span>${(selectedStock.current_price * quantity).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Brokerage (0.05%):</span>
                      <span>${calculateBrokerage(selectedStock.current_price, quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-600 pt-1 font-semibold text-white">
                      <span>Total Cost:</span>
                      <span>${calculateTotalCost(selectedStock.current_price, quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleBuy}
                  disabled={tradeMutation.isPending}
                  className="flex-1 btn-success disabled:opacity-50"
                >
                  {tradeMutation.isPending ? 'Processing...' : 'Buy'}
                </button>
                <button
                  onClick={handleSell}
                  disabled={tradeMutation.isPending}
                  className="flex-1 btn-danger disabled:opacity-50"
                >
                  {tradeMutation.isPending ? 'Processing...' : 'Sell'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradingFixed
