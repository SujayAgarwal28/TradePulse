import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/environment';

interface StockData {
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  change_percent: number;
}

const SimpleTradingPage = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching stocks from backend...');
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META'];
      const stockPromises = symbols.map(symbol => 
        fetch(`${API_BASE_URL}/stocks/${symbol}`)
          .then(res => res.json())
          .catch(err => {
            console.error(`Error fetching ${symbol}:`, err);
            return null;
          })
      );
      
      const results = await Promise.all(stockPromises);
      const validStocks = results.filter(stock => stock !== null).map(stock => ({
        ...stock,
        current_price: parseFloat(stock.current_price) || 0,
        previous_close: parseFloat(stock.previous_close) || 0,
        change_percent: parseFloat(stock.change_percent) || 0,
      }));
      
      console.log('Loaded stocks:', validStocks);
      setStocks(validStocks);
    } catch (err) {
      console.error('Error loading stocks:', err);
      setError('Failed to load stocks');
    } finally {
      setLoading(false);
    }
  };

  const buyStock = async (symbol: string) => {
    try {
      console.log(`Buying ${symbol}`);
      // Mock buy functionality for now
      alert(`Bought 1 share of ${symbol}`);
    } catch (err) {
      console.error('Buy error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">TradePulse Trading</h1>
        
        <div className="mb-6">
          <button 
            onClick={loadStocks}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded mr-4"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh Stocks'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stocks.map((stock) => (
            <div key={stock.symbol} className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-2">{stock.symbol}</h3>
              <p className="text-gray-300 mb-2">{stock.name}</p>
              <p className="text-2xl font-bold text-green-400 mb-2">
                ${stock.current_price?.toFixed(2) || 'N/A'}
              </p>
              <p className={`text-sm mb-4 ${
                (stock.change_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(stock.change_percent || 0) >= 0 ? '+' : ''}{(stock.change_percent || 0).toFixed(2)}%
              </p>
              <button 
                onClick={() => buyStock(stock.symbol)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
              >
                Buy 1 Share
              </button>
            </div>
          ))}
        </div>

        {stocks.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">No stocks loaded. Click "Refresh Stocks" to load data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleTradingPage;
