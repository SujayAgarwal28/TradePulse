"""
Portfolio schemas for TradePulse API.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class PositionValue(BaseModel):
    """Current value and P&L for a stock position."""
    symbol: str
    quantity: int
    average_cost: float
    current_price: float
    market_value: float
    cost_basis: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    last_updated: datetime


class PortfolioValue(BaseModel):
    """Current portfolio value including all positions."""
    portfolio_id: int
    cash_balance: float
    stock_value: float
    total_value: float
    positions: List[PositionValue]
    last_updated: datetime


class PortfolioPerformance(BaseModel):
    """Portfolio performance metrics over time."""
    portfolio_id: int
    period_days: int
    total_return: float
    total_return_percent: float
    daily_return_percent: float
    initial_value: float
    current_value: float
    best_performer: Optional[str] = None
    worst_performer: Optional[str] = None
    calculated_at: datetime


class RealPortfolioMetrics(BaseModel):
    """Real portfolio performance metrics for frontend display."""
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    volatility: float
    beta: float
    total_trades: int
    profitable_trades: int
    avg_holding_period: float  # in days
    total_fees_paid: float
    calculated_at: datetime


class PortfolioHistoryPoint(BaseModel):
    """Single point in portfolio history."""
    date: str
    portfolio_value: float
    daily_pnl: float
    cumulative_pnl: float
    cash_balance: float
    stock_value: float


class PortfolioHistoryData(BaseModel):
    """Portfolio historical performance data."""
    portfolio_id: int
    period_days: int
    history: List[PortfolioHistoryPoint]
    total_return: float
    total_return_percent: float
    generated_at: datetime


class PortfolioSummary(BaseModel):
    """Portfolio summary for dashboard."""
    portfolio_id: int
    user_id: int
    total_value: float
    cash_balance: float
    stock_value: float
    day_change: float = 0.0
    day_change_percent: float = 0.0
    total_return: float = 0.0
    total_return_percent: float = 0.0
    position_count: int = 0
    last_updated: datetime


class PortfolioUpdate(BaseModel):
    """Portfolio update request."""
    cash_adjustment: Optional[float] = None
    reset_to_initial: bool = False
