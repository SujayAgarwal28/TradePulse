"""
Trading engine for executing buy/sell orders and managing portfolios.
"""
from decimal import Decimal
from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException

from ..database import User, Portfolio, Trade, Position
from ..stocks.services import StockService


class TradingEngine:
    """Core trading engine for paper trading operations."""
    
    @staticmethod
    async def execute_buy_order(
        db: AsyncSession,
        user: User,
        symbol: str,
        quantity: int
    ) -> Tuple[Trade, str]:
        """Execute a buy order."""
        # Get current stock price
        stock_info = await StockService.get_stock_info(symbol)
        if not stock_info or not stock_info.current_price:
            raise HTTPException(status_code=400, detail="Unable to fetch stock price")
        
        current_price = stock_info.current_price
        total_cost = current_price * quantity
        fees = Decimal("0.00")  # No fees in paper trading
        total_amount = total_cost + fees
        
        # Get user's portfolio
        portfolio_result = await db.execute(
            select(Portfolio).where(Portfolio.user_id == user.id)
        )
        portfolio = portfolio_result.scalar_one_or_none()
        
        if not portfolio:
            raise HTTPException(status_code=400, detail="Portfolio not found")
        
        # Check if user has enough cash
        if portfolio.cash_balance < total_amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        
        # Create trade record
        trade = Trade(
            user_id=user.id,
            symbol=symbol.upper(),
            trade_type="buy",
            quantity=quantity,
            price=current_price,
            total_amount=total_amount,
            fees=fees
        )
        db.add(trade)
        
        # Update portfolio cash balance
        await db.execute(
            update(Portfolio)
            .where(Portfolio.user_id == user.id)
            .values(
                cash_balance=Portfolio.cash_balance - total_amount,
                total_invested=Portfolio.total_invested + total_amount
            )
        )
        
        # Update or create position
        position_result = await db.execute(
            select(Position).where(
                Position.user_id == user.id,
                Position.symbol == symbol.upper()
            )
        )
        existing_position = position_result.scalar_one_or_none()
        
        if existing_position:
            # Update existing position
            new_quantity = existing_position.quantity + quantity
            new_avg_price = (
                (existing_position.average_price * existing_position.quantity) +
                (current_price * quantity)
            ) / new_quantity
            
            await db.execute(
                update(Position)
                .where(Position.id == existing_position.id)
                .values(
                    quantity=new_quantity,
                    average_price=new_avg_price,
                    current_value=new_avg_price * new_quantity,
                    last_updated=datetime.utcnow()
                )
            )
        else:
            # Create new position
            new_position = Position(
                user_id=user.id,
                symbol=symbol.upper(),
                quantity=quantity,
                average_price=current_price,
                current_value=current_price * quantity
            )
            db.add(new_position)
        
        await db.commit()
        await db.refresh(trade)
        
        return trade, f"Successfully bought {quantity} shares of {symbol.upper()}"
    
    @staticmethod
    async def execute_sell_order(
        db: AsyncSession,
        user: User,
        symbol: str,
        quantity: int
    ) -> Tuple[Trade, str]:
        """Execute a sell order."""
        # Get current stock price
        stock_info = await StockService.get_stock_info(symbol)
        if not stock_info or not stock_info.current_price:
            raise HTTPException(status_code=400, detail="Unable to fetch stock price")
        
        current_price = stock_info.current_price
        
        # Check if user has enough shares
        position_result = await db.execute(
            select(Position).where(
                Position.user_id == user.id,
                Position.symbol == symbol.upper()
            )
        )
        position = position_result.scalar_one_or_none()
        
        if not position or position.quantity < quantity:
            raise HTTPException(status_code=400, detail="Insufficient shares to sell")
        
        total_proceeds = current_price * quantity
        fees = Decimal("0.00")  # No fees in paper trading
        net_proceeds = total_proceeds - fees
        
        # Create trade record
        trade = Trade(
            user_id=user.id,
            symbol=symbol.upper(),
            trade_type="sell",
            quantity=quantity,
            price=current_price,
            total_amount=total_proceeds,
            fees=fees
        )
        db.add(trade)
        
        # Update portfolio cash balance
        portfolio_result = await db.execute(
            select(Portfolio).where(Portfolio.user_id == user.id)
        )
        portfolio = portfolio_result.scalar_one_or_none()
        
        if portfolio:
            # Calculate realized P&L
            cost_basis = position.average_price * quantity
            realized_pnl = net_proceeds - cost_basis
            
            await db.execute(
                update(Portfolio)
                .where(Portfolio.user_id == user.id)
                .values(
                    cash_balance=Portfolio.cash_balance + net_proceeds,
                    total_invested=Portfolio.total_invested - cost_basis,
                    total_returns=Portfolio.total_returns + realized_pnl
                )
            )
        
        # Update position
        if position.quantity == quantity:
            # Remove position completely
            await db.delete(position)
        else:
            # Reduce position quantity
            new_quantity = position.quantity - quantity
            await db.execute(
                update(Position)
                .where(Position.id == position.id)
                .values(
                    quantity=new_quantity,
                    current_value=position.average_price * new_quantity,
                    last_updated=datetime.utcnow()
                )
            )
        
        await db.commit()
        await db.refresh(trade)
        
        return trade, f"Successfully sold {quantity} shares of {symbol.upper()}"
    
    @staticmethod
    async def update_portfolio_values(db: AsyncSession, user_id: int):
        """Update current values for all positions in portfolio."""
        # Get all positions for user
        positions_result = await db.execute(
            select(Position).where(Position.user_id == user_id)
        )
        positions = positions_result.scalars().all()
        
        total_portfolio_value = Decimal("0.00")
        
        # Get portfolio cash balance
        portfolio_result = await db.execute(
            select(Portfolio).where(Portfolio.user_id == user_id)
        )
        portfolio = portfolio_result.scalar_one_or_none()
        
        if portfolio:
            total_portfolio_value += portfolio.cash_balance
        
        # Update each position's current value
        for position in positions:
            stock_info = await StockService.get_stock_info(position.symbol)
            if stock_info and stock_info.current_price:
                current_value = stock_info.current_price * position.quantity
                unrealized_pnl = current_value - (position.average_price * position.quantity)
                
                await db.execute(
                    update(Position)
                    .where(Position.id == position.id)
                    .values(
                        current_value=current_value,
                        unrealized_pnl=unrealized_pnl,
                        last_updated=datetime.utcnow()
                    )
                )
                
                total_portfolio_value += current_value
        
        # Update portfolio total value
        if portfolio:
            await db.execute(
                update(Portfolio)
                .where(Portfolio.user_id == user_id)
                .values(total_value=total_portfolio_value)
            )
        
        await db.commit()
