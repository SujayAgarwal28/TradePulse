import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp, TrendingDown, Trophy, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface CompetitionPortfolio {
  competition_id: number;
  competition_name: string;
  starting_balance: number;
  current_cash: number;
  stock_value: number;
  total_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  holdings: Array<{
    symbol: string;
    quantity: number;
    current_price: number;
    current_value: number;
  }>;
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const CompetitionTrading: React.FC = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const [portfolio, setPortfolio] = useState<CompetitionPortfolio | null>(null);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);

  useEffect(() => {
    if (competitionId) {
      fetchPortfolio();
      fetchStocks();
    }
  }, [competitionId]);

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/trading/competitions/${competitionId}/portfolio`, {
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
      const response = await fetch(`${API_BASE_URL}/stocks/live`);
      if (response.ok) {
        const data = await response.json();
        setStocks(data.stocks || []);
      }
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
    }
  };

  const executeTrade = async () => {
    if (!selectedStock || !quantity || !portfolio) return;

    setTrading(true);
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = tradeType === 'buy' ? 'buy' : 'sell';
      
      const response = await fetch(`${API_BASE_URL}/trading/competitions/${competitionId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          quantity: parseInt(quantity),
          price: selectedStock.price,
        }),
      });

      if (response.ok) {
        alert(`Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${selectedStock.symbol}!`);
        setQuantity('');
        fetchPortfolio(); // Refresh portfolio
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

  const canAfford = (stock: StockQuote, qty: number): boolean => {
    if (!portfolio) return false;
    return portfolio.current_cash >= (stock.price * qty);
  };

  const getHolding = (symbol: string): number => {
    if (!portfolio) return 0;
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    return holding ? holding.quantity : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading competition trading...</div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Competition not found or you're not a participant</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Competition Header */}
        <div className="bg-purple-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span>Competition Trading</span>
              </h1>
              <p className="text-purple-200">{portfolio.competition_name}</p>
            </div>
            <button
              onClick={fetchPortfolio}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-700 rounded-lg p-4">
              <p className="text-sm text-purple-200">Starting Balance</p>
              <p className="text-xl font-bold">₹{portfolio.starting_balance.toLocaleString()}</p>
            </div>
            <div className="bg-purple-700 rounded-lg p-4">
              <p className="text-sm text-purple-200">Available Cash</p>
              <p className="text-xl font-bold">₹{portfolio.current_cash.toLocaleString()}</p>
            </div>
            <div className="bg-purple-700 rounded-lg p-4">
              <p className="text-sm text-purple-200">Portfolio Value</p>
              <p className="text-xl font-bold">₹{portfolio.total_value.toLocaleString()}</p>
            </div>
            <div className="bg-purple-700 rounded-lg p-4">
              <p className="text-sm text-purple-200">P&L</p>
              <p className={`text-xl font-bold ${portfolio.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.profit_loss >= 0 ? '+' : ''}₹{portfolio.profit_loss.toLocaleString()}
                <span className="text-sm ml-1">
                  ({portfolio.profit_loss_percentage.toFixed(2)}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stock Selection */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Available Stocks</h2>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {stocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedStock?.symbol === stock.symbol
                        ? 'bg-blue-600 border-2 border-blue-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{stock.symbol}</p>
                        <p className="text-sm text-gray-400">Holdings: {getHolding(stock.symbol)} shares</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{stock.price.toFixed(2)}</p>
                        <p className={`text-sm flex items-center space-x-1 ${
                          stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {stock.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Trade Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Execute Trade</h3>
              
              {selectedStock ? (
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="font-semibold">{selectedStock.symbol}</p>
                    <p className="text-2xl font-bold">₹{selectedStock.price.toFixed(2)}</p>
                  </div>

                  {/* Trade Type */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTradeType('buy')}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        tradeType === 'buy' ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setTradeType('sell')}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        tradeType === 'sell' ? 'bg-red-600' : 'bg-gray-600'
                      }`}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      max={tradeType === 'sell' ? getHolding(selectedStock.symbol) : undefined}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      placeholder="Enter quantity"
                    />
                  </div>

                  {/* Trade Summary */}
                  {quantity && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-2">Trade Summary</p>
                      <p>Total: ₹{(parseInt(quantity) * selectedStock.price).toLocaleString()}</p>
                      {tradeType === 'buy' && (
                        <p className="text-sm">
                          Remaining cash: ₹{(portfolio.current_cash - (parseInt(quantity) * selectedStock.price)).toLocaleString()}
                        </p>
                      )}
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
                      (tradeType === 'sell' && getHolding(selectedStock.symbol) < parseInt(quantity))
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 rounded-lg font-medium"
                  >
                    {trading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedStock.symbol}`}
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Select a stock to trade</p>
              )}
            </div>

            {/* Current Holdings */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Your Holdings</h3>
              {portfolio.holdings.length > 0 ? (
                <div className="space-y-3">
                  {portfolio.holdings.map((holding) => (
                    <div key={holding.symbol} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{holding.symbol}</p>
                          <p className="text-sm text-gray-400">{holding.quantity} shares</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{holding.current_value.toLocaleString()}</p>
                          <p className="text-sm text-gray-400">@₹{holding.current_price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No holdings yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionTrading;
