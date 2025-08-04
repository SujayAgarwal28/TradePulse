"""
Dashboard routes for analytics and performance data.
"""
from typing import Dict, List, Any, Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db, User, Portfolio
from ..auth.routes import get_current_user
from ..stocks.services import StockService
from ..trading.engine import TradingEngine
from ..trading.robust_services import trading_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview")
async def get_dashboard_overview(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get dashboard overview with key metrics."""
    # Get user's portfolio
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get portfolio data with LIVE prices
    portfolio_data = await trading_service.get_portfolio_data(db, portfolio.id)
    
    if not portfolio_data:
        # If no portfolio data, return basic info
        portfolio_data = {
            'cash_balance': float(portfolio.cash_balance),
            'total_portfolio_value': float(portfolio.cash_balance),
            'total_market_value': 0.0,
            'positions': []
        }
    
    # Update portfolio values
    await TradingEngine.update_portfolio_values(db, current_user.id)
    
    # Get market movers
    market_movers = await StockService.get_market_movers()
    
    return {
        "market_movers": market_movers,
        "portfolio": portfolio_data,
        "last_updated": "2024-01-01T00:00:00Z"  # Placeholder
    }


@router.get("/portfolio")
async def get_dashboard_portfolio(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get portfolio data specifically for dashboard display."""
    try:
        # Get user's portfolio
        portfolio_result = await db.execute(
            select(Portfolio).where(Portfolio.user_id == current_user.id)
        )
        portfolio = portfolio_result.scalar_one_or_none()
        
        if not portfolio:
            # Create portfolio if it doesn't exist
            portfolio = Portfolio(
                user_id=current_user.id,
                cash_balance=100000.00,
                total_value=100000.00,
                total_invested=0.00,
                total_returns=0.00
            )
            db.add(portfolio)
            await db.commit()
            await db.refresh(portfolio)
        
        # Get portfolio data with LIVE prices
        portfolio_data = await trading_service.get_portfolio_data(db, portfolio.id)
        
        if not portfolio_data:
            # Return basic portfolio info if detailed data fails
            return {
                'total_portfolio_value': float(portfolio.cash_balance),
                'cash_balance': float(portfolio.cash_balance),
                'total_market_value': 0.0,
                'positions': [],
                'day_change': 0.0,
                'day_change_percent': 0.0
            }
        
        return portfolio_data
        
    except Exception as e:
        print(f"Dashboard portfolio error: {e}")
        # Return default values if everything fails
        return {
            'total_portfolio_value': 100000.0,
            'cash_balance': 100000.0,
            'total_market_value': 0.0,
            'positions': [],
            'day_change': 0.0,
            'day_change_percent': 0.0
        }


@router.get("/performance")
async def get_performance_data(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get portfolio performance data for charts."""
    # This would typically return historical performance data
    # For now, we'll return sample data
    
    sample_dates = [
        "2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05",
        "2024-01-06", "2024-01-07", "2024-01-08", "2024-01-09", "2024-01-10"
    ]
    
    sample_values = [
        100000, 100250, 99800, 100500, 101000,
        100750, 101250, 101500, 101200, 101800
    ]
    
    return {
        "dates": sample_dates,
        "portfolio_values": sample_values,
        "benchmark_values": [100000 + (i * 50) for i in range(len(sample_dates))]
    }
