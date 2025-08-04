"""
Trading schemas for buy/sell operations and portfolio management.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, validator
from enum import Enum


class OrderType(str, Enum):
    BUY = "buy"
    SELL = "sell"


class TradeStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TradeRequest(BaseModel):
    """Schema for trade requests (buy/sell)."""
    symbol: str
    quantity: int
    order_type: OrderType
    
    @validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v


class TradeResponse(BaseModel):
    """Schema for trade response."""
    success: bool
    message: str
    trade_id: Optional[int] = None
    executed_price: Optional[float] = None
    executed_quantity: Optional[int] = None
    total_cost: Optional[float] = None
    total_proceeds: Optional[float] = None
    fees: Optional[float] = None


class PositionResponse(BaseModel):
    """Schema for portfolio positions."""
    symbol: str
    name: str
    quantity: int
    average_cost: float
    current_price: float
    market_value: float
    cost_basis: float
    unrealized_pnl: float
    unrealized_pnl_percent: float


class TradeHistoryItem(BaseModel):
    """Schema for trade history."""
    id: int
    symbol: str
    type: str
    quantity: int
    price: float
    total_amount: float
    fees: float
    status: str
    created_at: str


class PortfolioResponse(BaseModel):
    """Schema for portfolio summary."""
    id: int
    cash_balance: Decimal
    total_value: Decimal
    total_invested: Decimal
    total_returns: Decimal
    positions: List[PositionResponse] = []
    
    class Config:
        from_attributes = True


class PortfolioStats(BaseModel):
    """Schema for portfolio statistics."""
    total_value: Decimal
    cash_balance: Decimal
    invested_amount: Decimal
    total_return: Decimal
    total_return_percent: float
    day_change: Decimal
    day_change_percent: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
