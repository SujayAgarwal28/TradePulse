"""
Stock data schemas.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel


class StockBase(BaseModel):
    """Base stock schema."""
    symbol: str
    name: str


class StockInfo(StockBase):
    """Detailed stock information schema."""
    current_price: Optional[Decimal] = None
    previous_close: Optional[Decimal] = None
    change: Optional[Decimal] = None  # Absolute change amount
    change_percent: Optional[float] = None
    market_cap: Optional[Decimal] = None
    sector: Optional[str] = None
    volume: Optional[int] = None
    last_updated: Optional[datetime] = None


class StockPrice(BaseModel):
    """Simple stock price schema."""
    symbol: str
    price: Decimal
    timestamp: datetime


class StockHistory(BaseModel):
    """Stock price history schema."""
    symbol: str
    dates: List[str]
    prices: List[float]
    volumes: List[int]


class MarketMover(BaseModel):
    """Market mover schema for gainers/losers."""
    symbol: str
    name: str
    current_price: Decimal
    change: Optional[Decimal] = None  # Absolute change amount
    change_percent: float
