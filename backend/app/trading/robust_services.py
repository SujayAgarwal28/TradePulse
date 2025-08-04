"""
ROBUST Trading Service for TradePulse
Executes trades with REAL live market prices.
"""
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..database import Portfolio, Position, Trade, Stock
from ..stocks.live_data_service import live_data_service
from .schemas import TradeRequest, TradeResponse, OrderType, TradeStatus

logger = logging.getLogger(__name__)

class RobustTradingService:
    """Service for executing real-time stock trades with LIVE market prices."""
    
    @staticmethod
    async def execute_trade(db: AsyncSession, portfolio_id: int, trade_request: TradeRequest) -> TradeResponse:
        """
        Execute a trade with REAL live market price.
        This is the core function that makes your trading platform TRULY LIVE!
        """
        try:
            # Get live market price
            live_data = await live_data_service.get_live_price(trade_request.symbol)
            if not live_data:
                return TradeResponse(
                    success=False,
                    message=f"Unable to get live price for {trade_request.symbol}",
                    trade_id=None
                )
            
            current_price = Decimal(str(live_data['current_price']))
            trade_value = current_price * Decimal(str(trade_request.quantity))
            # Calculate 0.05% brokerage fee
            fees = trade_value * Decimal('0.0005')
            
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
            
            if trade_request.order_type == OrderType.BUY:
                # For BUY: Check if user has enough cash for trade_value + fees
                total_cost = trade_value + fees
                if portfolio.cash_balance < total_cost:
                    return TradeResponse(
                        success=False,
                        message=f"Insufficient funds. Need ${total_cost:.2f} (including ${fees:.2f} fees), have ${portfolio.cash_balance:.2f}",
                        trade_id=None
                    )
                
                # Execute buy order
                trade_result = await RobustTradingService._execute_buy(
                    db, portfolio, trade_request.symbol, trade_request.quantity, current_price
                )
                
            else:  # SELL
                # Execute sell order
                trade_result = await RobustTradingService._execute_sell(
                    db, portfolio, trade_request.symbol, trade_request.quantity, current_price
                )
            
            if trade_result['success']:
                await db.commit()
                logger.info(f"✅ Trade executed: {trade_request.order_type} {trade_request.quantity} {trade_request.symbol} @ ${current_price:.2f}")
                
                if trade_request.order_type == OrderType.BUY:
                    total_cost = trade_value + fees
                    return TradeResponse(
                        success=True,
                        message=f"Successfully bought {trade_request.quantity} shares of {trade_request.symbol} at ${current_price:.2f}",
                        trade_id=trade_result['trade_id'],
                        executed_price=float(current_price),
                        executed_quantity=trade_request.quantity,
                        total_cost=float(total_cost),
                        fees=float(fees)
                    )
                else:  # SELL
                    net_proceeds = trade_value - fees
                    return TradeResponse(
                        success=True,
                        message=f"Successfully sold {trade_request.quantity} shares of {trade_request.symbol} at ${current_price:.2f}",
                        trade_id=trade_result['trade_id'],
                        executed_price=float(current_price),
                        executed_quantity=trade_request.quantity,
                        total_proceeds=float(net_proceeds),
                        fees=float(fees)
                    )
            else:
                await db.rollback()
                return TradeResponse(
                    success=False,
                    message=trade_result['message'],
                    trade_id=None
                )
                
        except Exception as e:
            await db.rollback()
            logger.error(f"🚨 Trade execution error: {e}")
            return TradeResponse(
                success=False,
                message=f"Trade execution failed: {str(e)}",
                trade_id=None
            )
    
    @staticmethod
    async def _execute_buy(db: AsyncSession, portfolio: Portfolio, symbol: str, quantity: int, price: Decimal) -> Dict:
        """Execute a buy order with live market price."""
        try:
            trade_value = price * Decimal(str(quantity))
            # Calculate 0.05% brokerage fee
            fees = trade_value * Decimal('0.0005')  # 0.05% brokerage charge
            total_cost = trade_value + fees
            
            # Check if user has enough cash including fees
            if portfolio.cash_balance < total_cost:
                return {
                    'success': False,
                    'message': f"Insufficient funds. Need ${total_cost:.2f} (including ${fees:.2f} fees), have ${portfolio.cash_balance:.2f}"
                }
            
            # Create trade record
            trade = Trade(
                portfolio_id=portfolio.id,
                symbol=symbol,
                quantity=quantity,
                price=price,
                total_amount=trade_value,
                fees=fees,  # Include brokerage fees
                trade_type='buy',  # Changed from order_type to trade_type
                status='completed',
                created_at=datetime.now()
            )
            db.add(trade)
            await db.flush()  # Get trade ID
            
            # Update or create position
            position_result = await db.execute(
                select(Position).where(
                    and_(Position.portfolio_id == portfolio.id, Position.symbol == symbol)
                )
            )
            existing_position = position_result.scalar_one_or_none()
            
            if existing_position:
                # Update existing position (average cost calculation uses trade value, not including fees)
                old_value = existing_position.average_cost * Decimal(str(existing_position.quantity))
                new_value = old_value + trade_value  # Use trade_value, not total_cost
                new_quantity = existing_position.quantity + quantity
                new_average_cost = new_value / Decimal(str(new_quantity))
                
                existing_position.quantity = new_quantity
                existing_position.average_cost = new_average_cost
                existing_position.current_value = price * Decimal(str(new_quantity))
                existing_position.last_updated = datetime.now()
            else:
                # Create new position
                position = Position(
                    portfolio_id=portfolio.id,
                    user_id=portfolio.user_id,
                    symbol=symbol,
                    quantity=quantity,
                    average_cost=price,
                    current_value=trade_value,  # Use trade_value, not total_cost
                    unrealized_pnl=Decimal('0'),
                    last_updated=datetime.now()
                )
                db.add(position)
            
            # Update portfolio cash balance (deduct total cost including fees)
            portfolio.cash_balance -= total_cost
            portfolio.updated_at = datetime.now()
            
            logger.info(f"💰 BUY: {quantity} {symbol} @ ${price:.2f} = ${total_cost:.2f}")
            
            return {
                'success': True,
                'trade_id': trade.id,
                'message': f"Successfully bought {quantity} shares"
            }
            
        except Exception as e:
            logger.error(f"🚨 Buy execution error: {e}")
            return {
                'success': False,
                'message': f"Buy order failed: {str(e)}"
            }
    
    @staticmethod
    async def _execute_sell(db: AsyncSession, portfolio: Portfolio, symbol: str, quantity: int, price: Decimal) -> Dict:
        """Execute a sell order with live market price."""
        try:
            # Check if user has enough shares
            position_result = await db.execute(
                select(Position).where(
                    and_(Position.portfolio_id == portfolio.id, Position.symbol == symbol)
                )
            )
            position = position_result.scalar_one_or_none()
            
            if not position or position.quantity < quantity:
                available = position.quantity if position else 0
                return {
                    'success': False,
                    'message': f"Insufficient shares. Trying to sell {quantity}, have {available}"
                }
            
            trade_value = price * Decimal(str(quantity))
            # Calculate 0.05% brokerage fee
            fees = trade_value * Decimal('0.0005')  # 0.05% brokerage charge
            net_proceeds = trade_value - fees  # What user actually receives
            
            # Create trade record
            trade = Trade(
                portfolio_id=portfolio.id,
                symbol=symbol,
                quantity=quantity,
                price=price,
                total_amount=trade_value,
                fees=fees,  # Include brokerage fees
                trade_type='sell',  # Changed from order_type to trade_type
                status='completed',
                created_at=datetime.now()
            )
            db.add(trade)
            await db.flush()
            
            # Update position
            position.quantity -= quantity
            if position.quantity == 0:
                # Remove position if no shares left
                await db.delete(position)
            else:
                # Update position value
                position.current_value = price * Decimal(str(position.quantity))
                position.last_updated = datetime.now()
            
            # Update portfolio cash balance (add net proceeds after fees)
            portfolio.cash_balance += net_proceeds
            portfolio.updated_at = datetime.now()
            
            logger.info(f"💸 SELL: {quantity} {symbol} @ ${price:.2f} = ${trade_value:.2f} (net: ${net_proceeds:.2f} after ${fees:.2f} fees)")
            
            return {
                'success': True,
                'trade_id': trade.id,
                'message': f"Successfully sold {quantity} shares"
            }
            
        except Exception as e:
            logger.error(f"🚨 Sell execution error: {e}")
            return {
                'success': False,
                'message': f"Sell order failed: {str(e)}"
            }
    
    @staticmethod
    async def get_portfolio_data(db: AsyncSession, portfolio_id: int) -> Optional[Dict]:
        """Get portfolio data with LIVE market values."""
        try:
            # Get portfolio
            portfolio_result = await db.execute(
                select(Portfolio).where(Portfolio.id == portfolio_id)
            )
            portfolio = portfolio_result.scalar_one_or_none()
            if not portfolio:
                return None
            
            # Get all positions
            positions_result = await db.execute(
                select(Position).where(Position.portfolio_id == portfolio_id)
            )
            positions = positions_result.fetchall()
            
            total_market_value = Decimal('0')
            positions_data = []
            
            for pos_row in positions:
                position = pos_row.Position
                
                # Get live price for this position
                live_data = await live_data_service.get_live_price(position.symbol)
                if live_data:
                    current_price = Decimal(str(live_data['current_price']))
                    market_value = current_price * Decimal(str(position.quantity))
                    cost_basis = position.average_cost * Decimal(str(position.quantity))
                    unrealized_pnl = market_value - cost_basis
                    unrealized_pnl_percent = (unrealized_pnl / cost_basis * 100) if cost_basis > 0 else 0
                    
                    total_market_value += market_value
                    
                    positions_data.append({
                        'symbol': position.symbol,
                        'quantity': position.quantity,
                        'average_cost': float(position.average_cost),
                        'current_price': float(current_price),
                        'market_value': float(market_value),
                        'cost_basis': float(cost_basis),
                        'unrealized_pnl': float(unrealized_pnl),
                        'unrealized_pnl_percent': float(unrealized_pnl_percent)
                    })
            
            total_portfolio_value = portfolio.cash_balance + total_market_value
            
            return {
                'portfolio_id': portfolio.id,
                'cash_balance': float(portfolio.cash_balance),
                'total_market_value': float(total_market_value),
                'total_portfolio_value': float(total_portfolio_value),
                'positions': positions_data,
                'day_change': 0.0,  # Would calculate from yesterday's close
                'day_change_percent': 0.0
            }
            
        except Exception as e:
            logger.error(f"🚨 Error getting portfolio data: {e}")
            return None

# Create singleton instance
trading_service = RobustTradingService()
