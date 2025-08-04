import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface IndexChartProps {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
}

const IndianIndexChart: React.FC<IndexChartProps> = ({ 
  symbol, 
  name, 
  currentPrice = 0, 
  change = 0, 
  changePercent = 0 
}) => {
  const [chartData, setChartData] = useState<any>(null)
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M'>('1D')
  const [loading, setLoading] = useState(false)

  // Generate realistic intraday price data for Indian indices
  const generateIndexData = (timeframe: string) => {
    const now = new Date()
    const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90
    const labels = []
    const prices = []
    
    let basePrice = (currentPrice || 100) - (change || 0) // Yesterday's close
    
    for (let i = points; i >= 0; i--) {
      let label
      let price
      
      if (timeframe === '1D') {
        // Intraday data - every hour
        const time = new Date(now.getTime() - (i * 60 * 60 * 1000))
        label = time.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        })
        // Market opens at 9:15 AM, add realistic volatility
        if (time.getHours() >= 9 && time.getHours() <= 15) {
          const marketProgress = (time.getHours() - 9) / 6.25 // Market duration
          const volatility = (Math.random() - 0.5) * 0.02 // ±2% random movement
          price = basePrice * (1 + (change / basePrice) * marketProgress + volatility)
        } else {
          price = basePrice // Pre/post market
        }
      } else {
        // Daily data
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
        label = date.toLocaleDateString('en-IN', { 
          month: 'short', 
          day: 'numeric'
        })
        // Add realistic daily volatility
        const volatility = (Math.random() - 0.5) * 0.03 // ±3% daily movement
        price = basePrice * (1 + volatility)
      }
      
      labels.push(label)
      prices.push(Math.round(price * 100) / 100)
    }
    
    // Ensure last price matches current price
    prices[prices.length - 1] = currentPrice || 0
    
    return { labels, prices }
  }

  useEffect(() => {
    setLoading(true)
    
    // Simulate API delay
    setTimeout(() => {
      const { labels, prices } = generateIndexData(timeframe)
      
      const data = {
        labels,
        datasets: [
          {
            label: name,
            data: prices,
            borderColor: change >= 0 ? '#10b981' : '#ef4444',
            backgroundColor: change >= 0 ? '#10b98120' : '#ef444420',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      }
      
      setChartData(data)
      setLoading(false)
    }, 500)
  }, [symbol, timeframe, currentPrice, change, name])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: '#334155',
        },
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: timeframe === '1D' ? 8 : 10,
        },
      },
      y: {
        grid: {
          color: '#334155',
        },
        ticks: {
          color: '#94a3b8',
          callback: function(value: any) {
            return '₹' + value.toLocaleString('en-IN')
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-white">
              ₹{(currentPrice || 0).toLocaleString('en-IN')}
            </span>
            <div className={`flex items-center space-x-1 ${(change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(change || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">
                {(change || 0) >= 0 ? '+' : ''}₹{(change || 0).toFixed(2)} ({(changePercent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex space-x-1 bg-slate-700 rounded-lg p-1">
          {(['1D', '1W', '1M', '3M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-slate-400">
              <BarChart3 className="w-5 h-5 animate-pulse" />
              <span>Loading chart data...</span>
            </div>
          </div>
        ) : chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <span>Chart data unavailable</span>
          </div>
        )}
      </div>

      {/* Trading Actions */}
      <div className="flex space-x-3 mt-4">
        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
          Buy {symbol}
        </button>
        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
          Sell {symbol}
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
          Add to Watchlist
        </button>
      </div>
    </div>
  )
}

export default IndianIndexChart
