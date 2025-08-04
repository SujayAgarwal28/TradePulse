import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Trophy, RefreshCw, ArrowLeft, Search, Activity, PieChart, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface CompetitionPortfolio {
  cash_balance: number;
  total_stock_value: number;
  total_value: number;
  starting_balance: number;
  profit_loss: number;
  profit_loss_percentage: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    current_price: number;
    current_value: number;
    average_price: number;
    profit_loss: number;
    profit_loss_percentage: number;
  }>;
}

interface StockQuote {
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap?: number;
}

interface Trade {
  id: number;
  symbol: string;
  trade_type: string;
  quantity: number;
  price: number;
  total_amount: number;
  created_at: string;
}

const CompetitionTradingNew: React.FC = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const { token } = useAuth();
  const [portfolio, setPortfolio] = useState<CompetitionPortfolio | null>(null);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StockQuote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'trade' | 'history'>('portfolio');

  useEffect(() => {
    if (competitionId) {
      fetchPortfolio();
      fetchStocks();
      fetchTrades();
      
      // Set up interval for real-time updates
      const interval = setInterval(() => {
        fetchPortfolio();
        fetchStocks();
      }, 15000); // Update every 15 seconds
      
      return () => clearInterval(interval);
    }
  }, [competitionId]);

  useEffect(() => {
    if (searchTerm) {
      const debounceTimer = setTimeout(() => {
        searchStocks(searchTerm);
      }, 300); // Debounce search by 300ms

      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/competitions/${competitionId}/portfolio`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
      }
    } catch (err) {
      console.error('Failed to fetch competition portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async () => {
    try {
      // Try popular stocks first, fallback to search for common stocks
      let response = await fetch(`${API_BASE_URL}/stocks/popular`);
      if (!response.ok) {
        // Fallback: search for some popular stock symbols
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];
        const stockPromises = symbols.map(symbol => 
          fetch(`${API_BASE_URL}/stocks/search?q=${symbol}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => data.length > 0 ? data[0] : null)
            .catch(() => null)
        );
        const results = await Promise.all(stockPromises);
        const validStocks = results.filter(stock => stock !== null).map((stock: any) => ({
          ...stock,
          current_price: parseFloat(stock.current_price) || 0,
          change: parseFloat(stock.change) || 0,
          change_percent: parseFloat(stock.change_percent) || 0,
        }));
        setStocks(validStocks);
        return;
      }
      
      const data = await response.json();
      // Convert string prices to numbers
      const processedStocks = (data || []).map((stock: any) => ({
        ...stock,
        current_price: parseFloat(stock.current_price) || 0,
        change: parseFloat(stock.change) || 0,
        change_percent: parseFloat(stock.change_percent) || 0,
      }));
      setStocks(processedStocks);
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
      setStocks([]);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/competitions/${competitionId}/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
      }
    } catch (err) {
      console.error('Failed to fetch trades:', err);
    }
  };

  const executeTrade = async () => {
    if (!selectedStock || !quantity || !portfolio) return;

    setTrading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/competitions/${competitionId}/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          quantity: parseInt(quantity),
          order_type: tradeType,
        }),
      });

      if (response.ok) {
        await response.json();
        alert(`Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${selectedStock.symbol}!`);
        setQuantity('');
        setSelectedStock(null);
        
        // Refresh data
        fetchPortfolio();
        fetchTrades();
      } else {
        const error = await response.json();
        alert(`Trade failed: ${error.detail}`);
      }
    } catch (err) {
      console.error('Trade failed:', err);
      alert('Trade failed. Please try again.');
    } finally {
      setTrading(false);
    }
  };

  const searchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        // Convert string prices to numbers
        const processedResults = (results || []).map((stock: any) => ({
          ...stock,
          current_price: parseFloat(stock.current_price) || 0,
          change: parseFloat(stock.change) || 0,
          change_percent: parseFloat(stock.change_percent) || 0,
        }));
        setSearchResults(processedResults);
      }
    } catch (err) {
      console.error('Failed to search stocks:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to safely parse price values
  const safeParseFloat = (value: any): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

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

  const canAfford = (stock: StockQuote, qty: number): boolean => {
    if (!portfolio) return false;
    const totalCost = calculateTotalCost(safeParseFloat(stock.current_price), qty);
    return portfolio.cash_balance >= totalCost;
  };

  const getHolding = (symbol: string): number => {
    if (!portfolio) return 0;
    const position = portfolio.positions.find(p => p.symbol === symbol);
    return position ? position.quantity : 0;
  };

  const filteredStocks = searchTerm.length >= 2 ? searchResults : stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !portfolio) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading competition trading...</div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-400 mb-2">Competition not found</h2>
          <p className="text-gray-500 mb-6">You might not be a participant in this competition.</p>
          <Link
            to="/social"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Social Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link
              to={`/competitions/${competitionId}`}
              className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Competition Trading</h1>
              <p className="text-gray-400">Trade with your competition portfolio</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchPortfolio}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Portfolio Summary Banner */}
        <div className="bg-purple-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-purple-200 text-sm">Total Value</p>
              <p className="text-2xl font-bold">${portfolio.total_value.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">P&L</p>
              <p className={`text-2xl font-bold ${
                portfolio.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {portfolio.profit_loss >= 0 ? '+' : ''}${portfolio.profit_loss.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Return %</p>
              <p className={`text-2xl font-bold ${
                portfolio.profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {portfolio.profit_loss_percentage >= 0 ? '+' : ''}{portfolio.profit_loss_percentage.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Available Cash</p>
              <p className="text-2xl font-bold">${portfolio.cash_balance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'portfolio'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PieChart className="h-5 w-5 inline mr-2" />
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('trade')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'trade'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="h-5 w-5 inline mr-2" />
            Trade
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-5 w-5 inline mr-2" />
            History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Breakdown */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Portfolio Breakdown</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span>Cash</span>
                  <span className="font-semibold">${portfolio.cash_balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Stock Value</span>
                  <span className="font-semibold">${portfolio.total_stock_value.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-700 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total Value</span>
                    <span className="font-bold text-lg">${portfolio.total_value.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Asset Allocation */}
              <div className="space-y-2">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full" 
                    style={{ width: `${(portfolio.cash_balance / portfolio.total_value) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Cash: {((portfolio.cash_balance / portfolio.total_value) * 100).toFixed(1)}%</span>
                  <span>Stocks: {((portfolio.total_stock_value / portfolio.total_value) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Current Holdings */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Current Holdings</h3>
              {portfolio.positions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No positions yet</p>
                  <p className="text-sm">Start trading to build your portfolio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portfolio.positions.map((position) => (
                    <div key={position.symbol} className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">{position.symbol}</div>
                        <div className="text-sm text-gray-400">
                          {position.quantity} shares @ ${position.average_price.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${position.current_value.toLocaleString()}</div>
                        <div className={`text-sm ${
                          position.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.profit_loss >= 0 ? '+' : ''}${position.profit_loss.toFixed(2)} 
                          ({position.profit_loss_percentage.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trade' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock Search and List */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Available Stocks</h3>
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedStock?.symbol === stock.symbol
                        ? 'bg-purple-700 border border-purple-500'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-sm text-gray-400">{stock.name}</div>
                        {getHolding(stock.symbol) > 0 && (
                          <div className="text-sm text-blue-400">
                            Holding: {getHolding(stock.symbol)} shares
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">${safeParseFloat(stock.current_price).toFixed(2)}</div>
                        <div className={`text-sm ${
                          safeParseFloat(stock.change) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {safeParseFloat(stock.change) >= 0 ? '+' : ''}${safeParseFloat(stock.change).toFixed(2)} 
                          ({safeParseFloat(stock.change_percent).toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trading Panel */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Execute Trade</h3>
              
              {selectedStock ? (
                <div className="space-y-4">
                  {/* Selected Stock Info */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="font-semibold text-lg">{selectedStock.symbol}</div>
                    <div className="text-sm text-gray-400 mb-2">{selectedStock.name}</div>
                    <div className="flex justify-between items-center">
                      <span>Current Price:</span>
                      <span className="font-bold text-xl">${safeParseFloat(selectedStock.current_price).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Trade Type Selection */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTradeType('buy')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                        tradeType === 'buy'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setTradeType('sell')}
                      disabled={getHolding(selectedStock.symbol) === 0}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                        tradeType === 'sell'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={tradeType === 'sell' ? getHolding(selectedStock.symbol) : undefined}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter quantity"
                    />
                    {tradeType === 'sell' && (
                      <p className="text-sm text-gray-400 mt-1">
                        Available: {getHolding(selectedStock.symbol)} shares
                      </p>
                    )}
                  </div>

                  {/* Order Summary */}
                  {quantity && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Order Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Action:</span>
                          <span className="font-semibold">{tradeType.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span>{quantity} shares</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price per share:</span>
                          <span>${safeParseFloat(selectedStock.current_price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${(safeParseFloat(selectedStock.current_price) * parseInt(quantity || '0')).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Brokerage (0.05%):</span>
                          <span>${calculateBrokerage(safeParseFloat(selectedStock.current_price), parseInt(quantity || '0')).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-600 pt-1 font-semibold">
                          <span>Total Cost:</span>
                          <span>
                            ${calculateTotalCost(safeParseFloat(selectedStock.current_price), parseInt(quantity || '0')).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Execute Button */}
                  <button
                    onClick={executeTrade}
                    disabled={
                      trading || 
                      !quantity || 
                      parseInt(quantity) <= 0 ||
                      (tradeType === 'buy' && !canAfford(selectedStock, parseInt(quantity))) ||
                      (tradeType === 'sell' && parseInt(quantity) > getHolding(selectedStock.symbol))
                    }
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-colors"
                  >
                    {trading ? 'Processing...' : `${tradeType.toUpperCase()} ${selectedStock.symbol}`}
                  </button>

                  {/* Validation Messages */}
                  {quantity && tradeType === 'buy' && !canAfford(selectedStock, parseInt(quantity)) && (
                    <p className="text-red-400 text-sm">
                      Insufficient funds. You need ${(calculateTotalCost(safeParseFloat(selectedStock.current_price), parseInt(quantity)) - portfolio.cash_balance).toFixed(2)} more (including brokerage).
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a stock to trade</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Trading History</h3>
            
            {trades.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No trades yet</p>
                <p className="text-sm">Your trading history will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Time</th>
                      <th className="text-left py-3 px-4">Action</th>
                      <th className="text-left py-3 px-4">Symbol</th>
                      <th className="text-left py-3 px-4">Quantity</th>
                      <th className="text-left py-3 px-4">Price</th>
                      <th className="text-left py-3 px-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-400">
                            {new Date(trade.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            trade.trade_type.toUpperCase() === 'BUY'
                              ? 'bg-green-800 text-green-200'
                              : 'bg-red-800 text-red-200'
                          }`}>
                            {trade.trade_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">{trade.symbol}</td>
                        <td className="py-3 px-4">{trade.quantity}</td>
                        <td className="py-3 px-4">${trade.price.toFixed(2)}</td>
                        <td className="py-3 px-4 font-semibold">${trade.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionTradingNew;
