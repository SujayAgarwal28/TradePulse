"""
ROBUST Stock routes with REAL live market data.
"""
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from .schemas import StockInfo, StockHistory, MarketMover
from .robust_services import stock_service

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/search")
async def search_stocks(
    q: str = Query(..., description="Search query for stock symbol or name"),
    db: AsyncSession = Depends(get_db)
) -> List[StockInfo]:
    """Search for stocks with LIVE market data."""
    if len(q) < 1:
        raise HTTPException(status_code=400, detail="Query must be at least 1 character")
    
    results = await stock_service.search_stocks(q)
    return results


@router.get("/{symbol}", response_model=StockInfo)
async def get_stock_info(
    symbol: str,
    db: AsyncSession = Depends(get_db)
) -> StockInfo:
    """Get current stock information with LIVE market price."""
    stock_info = await stock_service.get_stock_info(symbol)
    if not stock_info:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    return stock_info


@router.get("/{symbol}/history", response_model=StockHistory)
async def get_stock_history(
    symbol: str,
    period: str = Query("1mo", description="Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)")
) -> StockHistory:
    """Get stock price history."""
    history = await stock_service.get_stock_history(symbol, period)
    if not history:
        raise HTTPException(status_code=404, detail="Stock history not found")
    
    return history


@router.get("/market/movers")
async def get_market_movers() -> Dict[str, List[MarketMover]]:
    """Get top market gainers and losers with LIVE data."""
    movers = await stock_service.get_market_movers()
    return movers


@router.get("/popular")
async def get_popular_stocks() -> List[StockInfo]:
    """Get popular stocks with LIVE market prices for trading dashboard."""
    stocks = await stock_service.get_popular_stocks()
    return stocks


@router.get("/indices/indian")
async def get_indian_indices() -> List[StockInfo]:
    """Get Indian market indices with LIVE market data."""
    indices = await stock_service.get_indian_indices()
    return indices


@router.get("/vix/india")
async def get_india_vix() -> Dict:
    """Get India VIX (volatility index) with LIVE market data."""
    vix_data = await stock_service.get_india_vix()
    return vix_data


@router.get("/market/sentiment")
async def get_market_sentiment() -> Dict:
    """Get real-time market sentiment based on advancing/declining stocks in Indian markets."""
    sentiment_data = await stock_service.get_market_sentiment()
    return sentiment_data


@router.get("/technical/{symbol}")
async def get_technical_indicators(symbol: str) -> Dict:
    """Get technical indicators (RSI, MACD, SMA) for a given symbol."""
    technical_data = await stock_service.get_technical_indicators(symbol)
    return technical_data
