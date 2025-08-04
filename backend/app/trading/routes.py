"""
ROBUST Trading routes with REAL live market prices.
"""
from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ..database import get_db, User, Portfolio, Trade, Position
from ..auth.routes import get_current_user
from .schemas import TradeRequest, TradeResponse, PortfolioResponse, PositionResponse, PortfolioStats, OrderType
from .robust_services import trading_service

router = APIRouter(prefix="/trading", tags=["trading"])


@router.post("/execute", response_model=TradeResponse)
async def execute_trade(
    trade_request: TradeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Execute a buy or sell order at LIVE market price."""
    # Get user's portfolio
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Execute the trade with LIVE market price
    result = await trading_service.execute_trade(db, portfolio.id, trade_request)
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return result


@router.post("/buy", response_model=TradeResponse)
async def buy_stock(
    symbol: str,
    quantity: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Quick buy endpoint."""
    trade_request = TradeRequest(symbol=symbol, quantity=quantity, order_type=OrderType.BUY)
    return await execute_trade(trade_request, current_user, db)


@router.post("/sell", response_model=TradeResponse)
async def sell_stock(
    symbol: str,
    quantity: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Quick sell endpoint."""
    trade_request = TradeRequest(symbol=symbol, quantity=quantity, order_type=OrderType.SELL)
    return await execute_trade(trade_request, current_user, db)


@router.get("/portfolio")
async def get_portfolio(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get user's portfolio with LIVE market values."""
    # Get portfolio
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get portfolio data with LIVE prices
    portfolio_data = await trading_service.get_portfolio_data(db, portfolio.id)
    
    if not portfolio_data:
        raise HTTPException(status_code=500, detail="Failed to get portfolio data")
    
    return portfolio_data


@router.get("/positions")
async def get_positions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get user's current positions with LIVE market values."""
    # Get portfolio
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get portfolio data with live values
    portfolio_data = await trading_service.get_portfolio_data(db, portfolio.id)
    
    if not portfolio_data:
        return []
    
    return portfolio_data.get('positions', [])


@router.get("/history")
async def get_trade_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
    limit: int = 50
):
    """Get user's trade history."""
    # Get portfolio
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get trade history
    trades_result = await db.execute(
        select(Trade)
        .where(Trade.portfolio_id == portfolio.id)
        .order_by(desc(Trade.created_at))
        .limit(limit)
    )
    trades = trades_result.fetchall()
    
    return [
        {
            "id": trade.Trade.id,
            "symbol": trade.Trade.symbol,
            "type": trade.Trade.trade_type,
            "quantity": trade.Trade.quantity,
            "price": float(trade.Trade.price),
            "total_amount": float(trade.Trade.total_amount),
            "fees": float(trade.Trade.fees),
            "status": trade.Trade.status,
            "created_at": trade.Trade.created_at.isoformat()
        }
        for trade in trades
    ]


@router.get("/stats")
async def get_portfolio_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get detailed portfolio statistics with LIVE data."""
    # Get portfolio
    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get portfolio data with live values
    portfolio_data = await trading_service.get_portfolio_data(db, portfolio.id)
    
    if not portfolio_data:
        raise HTTPException(status_code=500, detail="Failed to get portfolio stats")
    
    # Get trade count
    trades_result = await db.execute(
        select(Trade).where(Trade.portfolio_id == portfolio.id)
    )
    all_trades = trades_result.fetchall()
    
    buy_trades = [t for t in all_trades if t.Trade.trade_type == "buy"]
    sell_trades = [t for t in all_trades if t.Trade.trade_type == "sell"]
    
    # Calculate returns
    initial_value = 100000.0  # Starting amount
    current_value = portfolio_data['total_portfolio_value']
    total_return = current_value - initial_value
    total_return_percent = (total_return / initial_value) * 100 if initial_value > 0 else 0
    
    return {
        "total_value": current_value,
        "cash_balance": portfolio_data['cash_balance'],
        "invested_amount": portfolio_data['total_market_value'],
        "total_return": total_return,
        "total_return_percent": total_return_percent,
        "total_trades": len(all_trades),
        "buy_trades": len(buy_trades),
        "sell_trades": len(sell_trades),
        "positions_count": len(portfolio_data.get('positions', []))
    }
