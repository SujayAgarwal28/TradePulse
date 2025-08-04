"""
Portfolio routes for TradePulse API.
Real-time portfolio valuation and P&L tracking.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db, Portfolio
from ..auth.routes import get_current_user
from ..database import User
from .schemas import PortfolioValue, PortfolioPerformance, PortfolioSummary, RealPortfolioMetrics, PortfolioHistoryData
from .services import PortfolioService

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/value", response_model=PortfolioValue)
async def get_portfolio_value(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current portfolio value with real-time stock prices."""
    # Get user's portfolio explicitly to ensure it exists
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    portfolio_value = await PortfolioService.calculate_portfolio_value(
        db, portfolio.id
    )
    
    if not portfolio_value:
        raise HTTPException(status_code=500, detail="Unable to calculate portfolio value")
    
    return portfolio_value


@router.get("/performance", response_model=PortfolioPerformance)
async def get_portfolio_performance(
    period_days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio performance metrics over specified period."""
    # Get user's portfolio explicitly
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    performance = await PortfolioService.calculate_portfolio_performance(
        db, portfolio.id, period_days
    )
    
    if not performance:
        raise HTTPException(status_code=500, detail="Unable to calculate portfolio performance")
    
    return performance


@router.get("/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio summary for dashboard display."""
    # Get user's portfolio explicitly
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get current value
    portfolio_value = await PortfolioService.calculate_portfolio_value(
        db, portfolio.id
    )
    
    if not portfolio_value:
        raise HTTPException(status_code=500, detail="Unable to calculate portfolio value")
    
    # Get performance
    performance = await PortfolioService.calculate_portfolio_performance(
        db, portfolio.id, 1  # 1 day for day change
    )
    
    # Create summary
    summary = PortfolioSummary(
        portfolio_id=portfolio.id,
        user_id=current_user.id,
        total_value=portfolio_value.total_value,
        cash_balance=portfolio_value.cash_balance,
        stock_value=portfolio_value.stock_value,
        day_change=performance.total_return if performance else 0.0,
        day_change_percent=performance.total_return_percent if performance else 0.0,
        total_return=performance.total_return if performance else 0.0,
        total_return_percent=performance.total_return_percent if performance else 0.0,
        position_count=len(portfolio_value.positions),
        last_updated=portfolio_value.last_updated
    )
    
    return summary


@router.get("/metrics", response_model=RealPortfolioMetrics)
async def get_real_portfolio_metrics(
    period_days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get real portfolio performance metrics based on actual trade data."""
    # Get user's portfolio - same pattern as trading routes
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    metrics = await PortfolioService.calculate_real_portfolio_metrics(
        db, portfolio.id, period_days
    )
    
    if not metrics:
        raise HTTPException(status_code=500, detail="Unable to calculate portfolio metrics")
    
    return metrics


@router.get("/history", response_model=PortfolioHistoryData)
async def get_portfolio_history(
    period_days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio historical performance data for charts."""
    # Get user's portfolio - same pattern as trading routes
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    history = await PortfolioService.get_portfolio_history(
        db, portfolio.id, period_days
    )
    
    if not history:
        raise HTTPException(status_code=500, detail="Unable to get portfolio history")
    
    return history


@router.get("/positions/{symbol}/history")
async def get_position_history(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get trading history for a specific position."""
    # Get user's portfolio explicitly
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    history = await PortfolioService.get_position_history(
        db, portfolio.id, symbol.upper()
    )
    
    return {"symbol": symbol.upper(), "history": history}
