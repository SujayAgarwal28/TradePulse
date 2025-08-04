import { useState, useEffect } from 'react'
import { Search, TrendingUp, TrendingDown, Loader2, BarChart3, Building2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/environment'

interface StockData {
  symbol: string
  name: string
  current_price: number
  previous_close: number
  change_percent: number
  market_cap?: number
  sector?: string
  volume?: number
}

interface IndexData {
  symbol: string
  name: string
  current_price: number
  previous_close?: number
  change: number
  change_percent: number
  volume?: number
}

interface TradeRequest {
  symbol: string
  quantity: number
  order_type: 'buy' | 'sell'
}

type AssetType = 'stocks' | 'indices'

const Trading = () => {
  const [activeTab, setActiveTab] = useState<AssetType>('stocks')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const { isAuthenticated, token } = useAuth()
  const queryClient = useQueryClient()

  // Calculate brokerage charges (0.05% of trade value)
  const calculateBrokerage = (price: number, quantity: number): number => {
    const tradeValue = price * quantity
    return tradeValue * 0.0005 // 0.05%
  }

  // Calculate total trade cost including brokerage
  const calculateTotalCost = (price: number, quantity: number): number => {
    const tradeValue = price * quantity
    const brokerage = calculateBrokerage(price, quantity)
    return tradeValue + brokerage
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  // Fetch popular stocks
  const { data: stockData = [], isLoading: stocksLoading, error: stocksError } = useQuery({
    queryKey: ['popular-stocks'],
    queryFn: async (): Promise<StockData[]> => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX']
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

  // Fetch Indian indices
  const { data: indexData = [], isLoading: indicesLoading } = useQuery({
    queryKey: ['indian-indices'],
    queryFn: async (): Promise<IndexData[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/stocks/indices/indian`)
        if (!response.ok) throw new Error('Failed to fetch indices')
        const data = await response.json()
        return data.map((index: any) => ({
          symbol: index.symbol || index.name || 'Unknown',
          name: index.name || index.symbol || 'Unknown Index',
          current_price: parseFloat(String(index.current_price)) || 0,
          previous_close: parseFloat(String(index.previous_close)) || (parseFloat(String(index.current_price)) - parseFloat(String(index.change || 0))),
          change: parseFloat(String(index.change)) || 0,
          change_percent: parseFloat(String(index.change_percent)) || 0,
          volume: parseInt(String(index.volume || 0)) || 0
        }))
      } catch (error) {
        console.error('Error loading indices:', error)
        return []
      }
    },
    staleTime: 30000,
    refetchInterval: 60000,
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
      
      return response.json()
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'Trade executed successfully!')
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['popular-stocks'] })
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    onError: (error: Error) => {
      console.error('Trade error:', error)
    },
  })

  const handleStockSelect = async (stock: StockData) => {
    setSelectedStock(stock)
    setSelectedIndex(null)
  }

  const handleIndexSelect = (index: IndexData) => {
    setSelectedIndex(index)
    setSelectedStock(null)
  }

  const handleBuy = () => {
    const selectedAsset = selectedStock || selectedIndex
    if (selectedAsset) {
      tradeMutation.mutate({
        symbol: selectedAsset.symbol,
        quantity,
        order_type: 'buy'
      })
    }
  }

  const handleSell = () => {
    const selectedAsset = selectedStock || selectedIndex
    if (selectedAsset) {
      tradeMutation.mutate({
        symbol: selectedAsset.symbol,
        quantity,
        order_type: 'sell'
      })
    }
  }

  const getDisplayPrice = (asset: StockData | IndexData) => {
    const price = parseFloat(String(asset.current_price)) || 0
    return activeTab === 'stocks' ? `$${price.toFixed(2)}` : `₹${price.toFixed(2)}`
  }

  const getChangeDisplay = (asset: StockData | IndexData) => {
    const changePercent = parseFloat(String(asset.change_percent)) || 0
    const change = asset.current_price - (asset.previous_close || asset.current_price)
    const prefix = activeTab === 'stocks' ? '$' : '₹'
    
    return {
      change: change >= 0 ? `+${prefix}${Math.abs(change).toFixed(2)}` : `-${prefix}${Math.abs(change).toFixed(2)}`,
      percent: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      isPositive: changePercent >= 0
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading</h1>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['popular-stocks'] })
            queryClient.invalidateQueries({ queryKey: ['indian-indices'] })
          }}
          disabled={stocksLoading || indicesLoading}
          className="btn-primary flex items-center space-x-2"
        >
          <Loader2 className={`w-4 h-4 ${(stocksLoading || indicesLoading) ? 'animate-spin' : ''}`} />
          <span>{(stocksLoading || indicesLoading) ? 'Loading...' : 'Refresh Data'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Search and List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('stocks')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors flex-1 justify-center ${
                activeTab === 'stocks'
                  ? 'bg-finance-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Stocks</span>
            </button>
            <button
              onClick={() => setActiveTab('indices')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors flex-1 justify-center ${
                activeTab === 'indices'
                  ? 'bg-finance-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Indices</span>
            </button>
          </div>

          {/* Search Bar - Only for stocks */}
          {activeTab === 'stocks' && (
            <div className="card">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-finance-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-finance-accent focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Asset List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {activeTab === 'stocks' ? (
                  searchTerm ? `Search Results (${searchResults.length})` : `Popular Stocks (${stockData.length})`
                ) : (
                  `Indian Indices (${indexData.length})`
                )}
              </h2>
              {(stocksLoading || indicesLoading || searchLoading) && (
                <div className="flex items-center text-finance-accent">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </div>
              )}
            </div>

            {successMessage && (
              <div className="bg-finance-green/10 border border-finance-green/20 text-finance-green p-3 rounded-lg mb-4">
                {successMessage}
              </div>
            )}

            {tradeMutation.error && (
              <div className="bg-finance-red/10 border border-finance-red/20 text-finance-red p-3 rounded-lg mb-4">
                {tradeMutation.error.message}
              </div>
            )}

            <div className="space-y-2">
              {activeTab === 'stocks' ? (
                searchTerm.length > 0 ? (
                  searchResults.map((stock) => {
                    const changeData = getChangeDisplay(stock)
                    return (
                      <div
                        key={stock.symbol}
                        onClick={() => handleStockSelect(stock)}
                        className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedStock?.symbol === stock.symbol
                            ? 'bg-finance-accent bg-opacity-20 border border-finance-accent'
                            : 'bg-finance-dark hover:bg-gray-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{stock.symbol}</p>
                          <p className="text-sm text-gray-400">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{getDisplayPrice(stock)}</p>
                          <div className="flex items-center">
                            {changeData.isPositive ? (
                              <TrendingUp className="w-4 h-4 text-finance-green mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-finance-red mr-1" />
                            )}
                            <p className={`text-sm ${changeData.isPositive ? 'text-finance-green' : 'text-finance-red'}`}>
                              {changeData.percent}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  stockData.map((stock) => {
                    const changeData = getChangeDisplay(stock)
                    return (
                      <div
                        key={stock.symbol}
                        onClick={() => handleStockSelect(stock)}
                        className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedStock?.symbol === stock.symbol
                            ? 'bg-finance-accent bg-opacity-20 border border-finance-accent'
                            : 'bg-finance-dark hover:bg-gray-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{stock.symbol}</p>
                          <p className="text-sm text-gray-400">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{getDisplayPrice(stock)}</p>
                          <div className="flex items-center">
                            {changeData.isPositive ? (
                              <TrendingUp className="w-4 h-4 text-finance-green mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-finance-red mr-1" />
                            )}
                            <p className={`text-sm ${changeData.isPositive ? 'text-finance-green' : 'text-finance-red'}`}>
                              {changeData.percent}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
              ) : (
                // Indices List
                indexData.map((index) => {
                  const changeData = getChangeDisplay(index)
                  return (
                    <div
                      key={index.symbol}
                      onClick={() => handleIndexSelect(index)}
                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedIndex?.symbol === index.symbol
                          ? 'bg-finance-accent bg-opacity-20 border border-finance-accent'
                          : 'bg-finance-dark hover:bg-gray-700'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{index.symbol}</p>
                        <p className="text-sm text-gray-400">{index.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{getDisplayPrice(index)}</p>
                        <div className="flex items-center">
                          {changeData.isPositive ? (
                            <TrendingUp className="w-4 h-4 text-finance-green mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-finance-red mr-1" />
                          )}
                          <p className={`text-sm ${changeData.isPositive ? 'text-finance-green' : 'text-finance-red'}`}>
                            {changeData.percent}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              
              {activeTab === 'stocks' && searchTerm.length > 0 && searchResults.length === 0 && !searchLoading && (
                <div className="text-center py-8 text-gray-500">
                  No stocks found for "{searchTerm}"
                </div>
              )}
              
              {activeTab === 'stocks' && stockData.length === 0 && !stocksLoading && (
                <div className="text-center py-8 text-gray-500">
                  No stock data available
                </div>
              )}

              {activeTab === 'indices' && indexData.length === 0 && !indicesLoading && (
                <div className="text-center py-8 text-gray-500">
                  No index data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="space-y-4">
          {selectedStock || selectedIndex ? (
            <>
              {/* Asset Info */}
              <div className="card">
                {selectedStock ? (
                  <>
                    <h3 className="text-lg font-bold mb-2">{selectedStock.symbol}</h3>
                    <p className="text-sm text-gray-400 mb-4">{selectedStock.name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Current Price:</span>
                        <span className="font-semibold">{getDisplayPrice(selectedStock)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Previous Close:</span>
                        <span className="font-semibold">${(parseFloat(String(selectedStock.previous_close)) || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span className={getChangeDisplay(selectedStock).isPositive ? 'text-finance-green' : 'text-finance-red'}>
                          {getChangeDisplay(selectedStock).change} ({getChangeDisplay(selectedStock).percent})
                        </span>
                      </div>
                      {selectedStock.sector && (
                        <div className="flex justify-between">
                          <span>Sector:</span>
                          <span className="text-gray-400">{selectedStock.sector}</span>
                        </div>
                      )}
                      {selectedStock.market_cap && (
                        <div className="flex justify-between">
                          <span>Market Cap:</span>
                          <span className="text-gray-400">${(selectedStock.market_cap / 1e9).toFixed(1)}B</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : selectedIndex ? (
                  <>
                    <h3 className="text-lg font-bold mb-2">{selectedIndex.symbol}</h3>
                    <p className="text-sm text-gray-400 mb-4">{selectedIndex.name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Current Price:</span>
                        <span className="font-semibold">{getDisplayPrice(selectedIndex)}</span>
                      </div>
                      {selectedIndex.previous_close && (
                        <div className="flex justify-between">
                          <span>Previous Close:</span>
                          <span className="font-semibold">₹{(parseFloat(String(selectedIndex.previous_close)) || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span className={getChangeDisplay(selectedIndex).isPositive ? 'text-finance-green' : 'text-finance-red'}>
                          {getChangeDisplay(selectedIndex).change} ({getChangeDisplay(selectedIndex).percent})
                        </span>
                      </div>
                      {selectedIndex.volume && selectedIndex.volume > 0 && (
                        <div className="flex justify-between">
                          <span>Volume:</span>
                          <span className="text-gray-400">{(selectedIndex.volume / 1000000).toFixed(1)}M</span>
                        </div>
                      )}
                      <div className="mt-3 p-2 bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-300">
                          🏛️ Index trading allows you to trade the entire market index as a single instrument
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Order Form */}
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Place Order</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-finance-dark border border-gray-600 rounded-lg text-white focus:border-finance-accent focus:outline-none"
                    />
                  </div>
                  
                  {/* Brokerage Calculation */}
                  <div className="bg-gray-800 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Trade Value:</span>
                      <span>
                        {selectedStock ? 
                          `$${(selectedStock.current_price * quantity).toFixed(2)}` : 
                          `₹${(selectedIndex!.current_price * quantity).toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Brokerage (0.05%):</span>
                      <span>
                        {selectedStock ? 
                          `$${calculateBrokerage(selectedStock.current_price, quantity).toFixed(2)}` : 
                          `₹${calculateBrokerage(selectedIndex!.current_price, quantity).toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
                      <span>Total Cost:</span>
                      <span>
                        {selectedStock ? 
                          `$${calculateTotalCost(selectedStock.current_price, quantity).toFixed(2)}` : 
                          `₹${calculateTotalCost(selectedIndex!.current_price, quantity).toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleBuy}
                      disabled={tradeMutation.isPending}
                      className="btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tradeMutation.isPending ? 'Processing...' : 'Buy'}
                    </button>
                    <button
                      onClick={handleSell}
                      disabled={tradeMutation.isPending}
                      className="btn-danger w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tradeMutation.isPending ? 'Processing...' : 'Sell'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <p className="text-gray-400 text-center">
                Select a {activeTab === 'stocks' ? 'stock' : 'market index'} to start trading
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Trading
