// User and Authentication Types
export interface User {
  id: number
  email: string
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

// Stock Types
export interface Stock {
  symbol: string
  name: string
  price?: number
  change?: number
  changePercent?: number
}

export interface StockInfo {
  symbol: string
  name: string
  current_price?: number
  previous_close?: number
  market_cap?: number
  sector?: string
  change_percent?: number
  volume?: number
  last_updated?: string
}

export interface StockHistory {
  symbol: string
  dates: string[]
  prices: number[]
  volumes: number[]
}

export interface MarketMover {
  symbol: string
  name: string
  price: number
  change: number
  change_percent: number
}

export interface MarketMovers {
  gainers: MarketMover[]
  losers: MarketMover[]
}

// Trading Types
export interface TradeRequest {
  symbol: string
  quantity: number
  trade_type: 'buy' | 'sell'
}

export interface Trade {
  id: number
  symbol: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number
  total_amount: number
  fees: number
  timestamp: string
}

export interface Position {
  id: number
  symbol: string
  quantity: number
  average_price: number
  current_value?: number
  unrealized_pnl?: number
  last_updated: string
}

export interface Portfolio {
  id: number
  cash_balance: number
  total_value: number
  total_invested: number
  total_returns: number
  positions: Position[]
}

export interface PortfolioStats {
  total_value: number
  cash_balance: number
  invested_amount: number
  total_return: number
  total_return_percent: number
  day_change: number
  day_change_percent: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
}

// Real Portfolio Metrics
export interface RealPortfolioMetrics {
  sharpe_ratio: number
  max_drawdown: number
  win_rate: number
  volatility: number
  beta: number
  total_trades: number
  profitable_trades: number
  avg_holding_period: number
  total_fees_paid: number
  calculated_at: string
}

// Portfolio History
export interface PortfolioHistoryPoint {
  date: string
  portfolio_value: number
  daily_pnl: number
  cumulative_pnl: number
  cash_balance: number
  stock_value: number
}

export interface PortfolioHistoryData {
  portfolio_id: number
  period_days: number
  history: PortfolioHistoryPoint[]
  total_return: number
  total_return_percent: number
  generated_at: string
}

// Dashboard Types
export interface DashboardOverview {
  market_movers: MarketMovers
  last_updated: string
}

export interface PerformanceData {
  dates: string[]
  portfolio_values: number[]
  benchmark_values: number[]
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface ApiError {
  detail: string
  status_code: number
}
