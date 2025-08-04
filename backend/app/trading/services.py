"""
Real-time trading service for TradePulse.
Handles buy/sell orders with real market prices.
"""
import asyncio
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..database import Portfolio, Position, Trade, Stock
from ..stocks.services import StockService
from .schemas import TradeRequest, TradeResponse, OrderType, TradeStatus


class TradingService:
    """Service for executing real-time stock trades."""
    
    @staticmethod
    async def execute_trade(
        db: AsyncSession,
        portfolio_id: int,
        trade_request: TradeRequest
    ) -> TradeResponse:
        """Execute a buy or sell trade at current market price."""
        try:
            # Get real-time stock price
            stock_info = await StockService.get_stock_info(trade_request.symbol)
            if not stock_info:
                return TradeResponse(
                    success=False,
                    message=f"Unable to get current price for {trade_request.symbol}",
                    trade_id=None
                )
            
            current_price = Decimal(str(stock_info.current_price))
            symbol = trade_request.symbol.upper()
            quantity = trade_request.quantity
            
            # Get portfolio
            portfolio_result = await db.execute(
                select(Portfolio).where(Portfolio.id == portfolio_id)
            )
            portfolio = portfolio_result.scalar_one_or_none()
            if not portfolio:
                return TradeResponse(
                    success=False,
                    message="Portfolio not found",
                    trade_id=None
                )
            
            # Calculate trade value and brokerage (0.05%)
            trade_value = current_price * Decimal(str(quantity))
            fees = trade_value * Decimal('0.0005')  # 0.05% brokerage charge
            total_cost = trade_value + fees
            
            if trade_request.order_type == OrderType.BUY:
                return await TradingService._execute_buy_order(
                    db, portfolio, symbol, quantity, current_price, trade_value, fees, stock_info.name
                )
            else:
                return await TradingService._execute_sell_order(
                    db, portfolio, symbol, quantity, current_price, trade_value, fees
                )
                
        except Exception as e:
            print(f"Error executing trade: {e}")
            return TradeResponse(
                success=False,
                message=f"Trade execution failed: {str(e)}",
                trade_id=None
            )
    
    @staticmethod
    async def _execute_buy_order(
        db: AsyncSession,
        portfolio: Portfolio,
        symbol: str,
        quantity: int,
        price: Decimal,
        trade_value: Decimal,
        fees: Decimal,
        stock_name: str
    ) -> TradeResponse:
        """Execute a buy order."""
        total_cost = trade_value + fees
        
        # Check if portfolio has enough cash
        if portfolio.cash_balance < total_cost:
            return TradeResponse(
                success=False,
                message=f"Insufficient funds. Need ${total_cost:.2f}, have ${portfolio.cash_balance:.2f}",
                trade_id=None
            )
        
        # Update cash balance
        portfolio.cash_balance -= total_cost
        
        # Get or create position
        position_result = await db.execute(
            select(Position).where(
                and_(Position.portfolio_id == portfolio.id, Position.symbol == symbol)
            )
        )
        position = position_result.scalar_one_or_none()
        
        if position:
            # Update existing position
            total_value = (position.average_cost * Decimal(str(position.quantity))) + trade_value
            total_quantity = position.quantity + quantity
            position.average_cost = total_value / Decimal(str(total_quantity))
            position.quantity = total_quantity
        else:
            # Create new position
            position = Position(
                portfolio_id=portfolio.id,
                symbol=symbol,
                quantity=quantity,
                average_cost=price
            )
            db.add(position)
        
        # Create trade record
        trade = Trade(
            portfolio_id=portfolio.id,
            symbol=symbol,
            trade_type="buy",
            quantity=quantity,
            price=price,
            total_amount=trade_value,
            fees=fees,
            status=TradeStatus.COMPLETED
        )
        db.add(trade)
        
        # Update or create stock cache
        await TradingService._update_stock_cache(db, symbol, price, stock_name)
        
        await db.commit()
        await db.refresh(trade)
        
        return TradeResponse(
            success=True,
            message=f"Successfully bought {quantity} shares of {symbol} at ${price:.2f} per share",
            trade_id=trade.id,
            executed_price=float(price),
            executed_quantity=quantity,
            total_cost=float(total_cost),
            fees=float(fees)
        )
    
    @staticmethod
    async def _execute_sell_order(
        db: AsyncSession,
        portfolio: Portfolio,
        symbol: str,
        quantity: int,
        price: Decimal,
        trade_value: Decimal,
        fees: Decimal
    ) -> TradeResponse:
        """Execute a sell order."""
        # Get position
        position_result = await db.execute(
            select(Position).where(
                and_(Position.portfolio_id == portfolio.id, Position.symbol == symbol)
            )
        )
        position = position_result.scalar_one_or_none()
        
        if not position or position.quantity < quantity:
            available = position.quantity if position else 0
            return TradeResponse(
                success=False,
                message=f"Insufficient shares. Trying to sell {quantity}, have {available}",
                trade_id=None
            )
        
        # Update position
        position.quantity -= quantity
        
        # If position is empty, remove it
        if position.quantity == 0:
            await db.delete(position)
        
        # Update cash balance (add proceeds minus fees)
        net_proceeds = trade_value - fees
        portfolio.cash_balance += net_proceeds
        
        # Create trade record
        trade = Trade(
            portfolio_id=portfolio.id,
            symbol=symbol,
            trade_type="sell",
            quantity=quantity,
            price=price,
            total_amount=trade_value,
            fees=fees,
            status=TradeStatus.COMPLETED
        )
        db.add(trade)
        
        await db.commit()
        await db.refresh(trade)
        
        return TradeResponse(
            success=True,
            message=f"Successfully sold {quantity} shares of {symbol} at ${price:.2f} per share",
            trade_id=trade.id,
            executed_price=float(price),
            executed_quantity=quantity,
            total_proceeds=float(net_proceeds),
            fees=float(fees)
        )
    
    @staticmethod
    async def _update_stock_cache(
        db: AsyncSession,
        symbol: str,
        price: Decimal,
        name: str
    ):
        """Update stock information in cache."""
        try:
            # Check if stock exists in cache
            result = await db.execute(select(Stock).where(Stock.symbol == symbol))
            existing_stock = result.scalar_one_or_none()
            
            if existing_stock:
                # Update existing stock
                existing_stock.current_price = price
                existing_stock.name = name
                existing_stock.last_updated = datetime.utcnow()
            else:
                # Create new stock entry
                new_stock = Stock(
                    symbol=symbol,
                    name=name,
                    current_price=price,
                    previous_close=price,  # Will be updated with real data later
                    last_updated=datetime.utcnow()
                )
                db.add(new_stock)
        except Exception as e:
            print(f"Error updating stock cache: {e}")
    
    @staticmethod
    async def get_portfolio_positions(db: AsyncSession, portfolio_id: int) -> List[Dict]:
        """Get all current positions with real-time values."""
        try:
            # Get all positions
            positions_result = await db.execute(
                select(Position).where(
                    and_(Position.portfolio_id == portfolio_id, Position.quantity > 0)
                )
            )
            positions = positions_result.scalars().all()
            
            position_data = []
            for position in positions:
                # Get current price
                stock_info = await StockService.get_stock_info(position.symbol)
                if stock_info:
                    current_price = stock_info.current_price
                    market_value = current_price * position.quantity
                    cost_basis = float(position.average_cost) * position.quantity
                    unrealized_pnl = market_value - cost_basis
                    unrealized_pnl_percent = (unrealized_pnl / cost_basis) * 100 if cost_basis > 0 else 0
                    
                    position_data.append({
                        "symbol": position.symbol,
                        "name": stock_info.name,
                        "quantity": position.quantity,
                        "average_cost": float(position.average_cost),
                        "current_price": current_price,
                        "market_value": market_value,
                        "cost_basis": cost_basis,
                        "unrealized_pnl": unrealized_pnl,
                        "unrealized_pnl_percent": unrealized_pnl_percent
                    })
            
            return position_data
        except Exception as e:
            print(f"Error getting portfolio positions: {e}")
            return []
    
    @staticmethod
    async def get_trade_history(db: AsyncSession, portfolio_id: int, limit: int = 50) -> List[Dict]:
        """Get recent trade history."""
        try:
            trades_result = await db.execute(
                select(Trade)
                .where(Trade.portfolio_id == portfolio_id)
                .order_by(Trade.created_at.desc())
                .limit(limit)
            )
            trades = trades_result.scalars().all()
            
            trade_history = []
            for trade in trades:
                trade_history.append({
                    "id": trade.id,
                    "symbol": trade.symbol,
                    "type": trade.trade_type,
                    "quantity": trade.quantity,
                    "price": float(trade.price),
                    "total_amount": float(trade.total_amount),
                    "fees": float(trade.fees) if trade.fees else 0,
                    "status": trade.status,
                    "created_at": trade.created_at.isoformat()
                })
            
            return trade_history
        except Exception as e:
            print(f"Error getting trade history: {e}")
            return []
