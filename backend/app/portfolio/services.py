"""
Portfolio value calculation and P&L tracking service.
Real-time portfolio valuation for paper trading.
"""
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
import math

from ..database import Portfolio, Position, Stock, Trade
from ..stocks.robust_services import stock_service
from .schemas import PortfolioValue, PositionValue, PortfolioPerformance, RealPortfolioMetrics, PortfolioHistoryData, PortfolioHistoryPoint


class PortfolioService:
    """Service for calculating portfolio values and performance metrics."""
    
    @staticmethod
    async def calculate_portfolio_value(db: AsyncSession, portfolio_id: int) -> Optional[PortfolioValue]:
        """Calculate current portfolio value including cash and stock positions."""
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
                select(Position).where(
                    and_(Position.portfolio_id == portfolio_id, Position.quantity > 0)
                )
            )
            positions = positions_result.scalars().all()
            
            # Calculate position values
            position_values = []
            total_stock_value = Decimal('0')
            
            for position in positions:
                # Get current stock price
                stock_info = await stock_service.get_stock_info(position.symbol)
                if stock_info:
                    current_price = Decimal(str(stock_info.current_price))
                    position_value = current_price * Decimal(str(position.quantity))
                    cost_basis = position.average_cost * Decimal(str(position.quantity))
                    
                    pnl = position_value - cost_basis
                    pnl_percent = (pnl / cost_basis * 100) if cost_basis > 0 else Decimal('0')
                    
                    position_values.append(PositionValue(
                        symbol=position.symbol,
                        quantity=position.quantity,
                        average_cost=float(position.average_cost),
                        current_price=float(current_price),
                        market_value=float(position_value),
                        cost_basis=float(cost_basis),
                        unrealized_pnl=float(pnl),
                        unrealized_pnl_percent=float(pnl_percent),
                        last_updated=datetime.utcnow()
                    ))
                    
                    total_stock_value += position_value
            
            # Calculate total portfolio value
            total_value = portfolio.cash_balance + total_stock_value
            
            return PortfolioValue(
                portfolio_id=portfolio_id,
                cash_balance=float(portfolio.cash_balance),
                stock_value=float(total_stock_value),
                total_value=float(total_value),
                positions=position_values,
                last_updated=datetime.utcnow()
            )
            
        except Exception as e:
            print(f"Error calculating portfolio value: {e}")
            return None
    
    @staticmethod
    async def calculate_portfolio_performance(
        db: AsyncSession, 
        portfolio_id: int, 
        period_days: int = 30
    ) -> Optional[PortfolioPerformance]:
        """Calculate portfolio performance over a specified period."""
        try:
            # Get current portfolio value
            current_value = await PortfolioService.calculate_portfolio_value(db, portfolio_id)
            if not current_value:
                return None
            
            # Get portfolio
            portfolio_result = await db.execute(
                select(Portfolio).where(Portfolio.id == portfolio_id)
            )
            portfolio = portfolio_result.scalar_one_or_none()
            if not portfolio:
                return None
            
            # Calculate returns (simplified - using initial balance as baseline)
            initial_balance = portfolio.initial_balance
            total_return = current_value.total_value - float(initial_balance)
            total_return_percent = (total_return / float(initial_balance)) * 100 if initial_balance > 0 else 0
            
            # Calculate daily return (simplified)
            daily_return_percent = total_return_percent / period_days if period_days > 0 else 0
            
            return PortfolioPerformance(
                portfolio_id=portfolio_id,
                period_days=period_days,
                total_return=total_return,
                total_return_percent=total_return_percent,
                daily_return_percent=daily_return_percent,
                initial_value=float(initial_balance),
                current_value=current_value.total_value,
                best_performer=None,  # TODO: Implement
                worst_performer=None,  # TODO: Implement
                calculated_at=datetime.utcnow()
            )
            
        except Exception as e:
            print(f"Error calculating portfolio performance: {e}")
            return None
    
    @staticmethod
    async def calculate_real_portfolio_metrics(
        db: AsyncSession, 
        portfolio_id: int, 
        period_days: int = 30
    ) -> Optional[RealPortfolioMetrics]:
        """Calculate real portfolio performance metrics based on actual trade data."""
        try:
            # Get all trades for this portfolio
            trades_result = await db.execute(
                select(Trade).where(Trade.portfolio_id == portfolio_id)
                .order_by(Trade.created_at.asc())
            )
            all_trades = trades_result.scalars().all()
            
            if not all_trades:
                # Return default metrics for empty portfolio
                return RealPortfolioMetrics(
                    sharpe_ratio=0.0,
                    max_drawdown=0.0,
                    win_rate=0.0,
                    volatility=0.0,
                    beta=1.0,
                    total_trades=0,
                    profitable_trades=0,
                    avg_holding_period=0.0,
                    total_fees_paid=0.0,
                    calculated_at=datetime.utcnow()
                )
            
            # Calculate basic trade statistics
            total_trades = len(all_trades)
            total_fees = sum(float(trade.fees) if trade.fees else 0.0 for trade in all_trades)
            
            # Group trades by symbol to calculate profitability
            symbol_trades = {}
            for trade in all_trades:
                if trade.symbol not in symbol_trades:
                    symbol_trades[trade.symbol] = []
                symbol_trades[trade.symbol].append(trade)
            
            profitable_trades = 0
            total_holding_days = 0
            holding_periods = []
            
            # Calculate profitability and holding periods
            for symbol, trades in symbol_trades.items():
                buy_trades = [t for t in trades if t.trade_type == 'buy']
                sell_trades = [t for t in trades if t.trade_type == 'sell']
                
                # Simple calculation: each sell trade against average buy price
                if buy_trades and sell_trades:
                    avg_buy_price = sum(float(t.price) for t in buy_trades) / len(buy_trades)
                    
                    for sell_trade in sell_trades:
                        if float(sell_trade.price) > avg_buy_price:
                            profitable_trades += 1
                        
                        # Calculate holding period (simplified)
                        if buy_trades:
                            latest_buy = max(buy_trades, key=lambda t: t.created_at)
                            holding_period = (sell_trade.created_at - latest_buy.created_at).days
                            holding_periods.append(holding_period)
            
            # Calculate metrics
            win_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0.0
            avg_holding_period = sum(holding_periods) / len(holding_periods) if holding_periods else 0.0
            
            # Calculate portfolio returns for volatility and Sharpe ratio
            portfolio_returns = await PortfolioService._calculate_daily_returns(db, portfolio_id, period_days)
            
            volatility = PortfolioService._calculate_volatility(portfolio_returns)
            sharpe_ratio = PortfolioService._calculate_sharpe_ratio(portfolio_returns, risk_free_rate=0.02)
            max_drawdown = PortfolioService._calculate_max_drawdown(portfolio_returns)
            
            return RealPortfolioMetrics(
                sharpe_ratio=sharpe_ratio,
                max_drawdown=max_drawdown,
                win_rate=win_rate,
                volatility=volatility,
                beta=1.0,  # Simplified beta calculation
                total_trades=total_trades,
                profitable_trades=profitable_trades,
                avg_holding_period=avg_holding_period,
                total_fees_paid=total_fees,
                calculated_at=datetime.utcnow()
            )
            
        except Exception as e:
            print(f"Error calculating real portfolio metrics: {e}")
            return None
    
    @staticmethod
    async def get_portfolio_history(
        db: AsyncSession,
        portfolio_id: int,
        period_days: int = 30
    ) -> Optional[PortfolioHistoryData]:
        """Get real portfolio history data for charts."""
        try:
            # Get portfolio
            portfolio_result = await db.execute(
                select(Portfolio).where(Portfolio.id == portfolio_id)
            )
            portfolio = portfolio_result.scalar_one_or_none()
            if not portfolio:
                return None
            
            # Get all trades within the period
            start_date = datetime.utcnow() - timedelta(days=period_days)
            trades_result = await db.execute(
                select(Trade).where(
                    and_(
                        Trade.portfolio_id == portfolio_id,
                        Trade.created_at >= start_date
                    )
                ).order_by(Trade.created_at.asc())
            )
            trades = trades_result.scalars().all()
            
            # Calculate daily portfolio values
            history_points = []
            current_date = start_date.date()
            end_date = datetime.utcnow().date()
            
            initial_value = 100000.0  # Starting portfolio value
            current_portfolio_value = initial_value
            
            while current_date <= end_date:
                # Get trades for this date
                day_trades = [t for t in trades if t.created_at.date() == current_date]
                
                # Calculate day's P&L (simplified)
                daily_pnl = 0.0
                for trade in day_trades:
                    if trade.trade_type == 'buy':
                        daily_pnl -= float(trade.total_amount)
                    else:  # sell
                        daily_pnl += float(trade.total_amount)
                
                current_portfolio_value += daily_pnl
                cumulative_pnl = current_portfolio_value - initial_value
                
                history_points.append(PortfolioHistoryPoint(
                    date=current_date.isoformat(),
                    portfolio_value=current_portfolio_value,
                    daily_pnl=daily_pnl,
                    cumulative_pnl=cumulative_pnl,
                    cash_balance=float(portfolio.cash_balance),
                    stock_value=current_portfolio_value - float(portfolio.cash_balance)
                ))
                
                current_date += timedelta(days=1)
            
            total_return = current_portfolio_value - initial_value
            total_return_percent = (total_return / initial_value * 100) if initial_value > 0 else 0.0
            
            return PortfolioHistoryData(
                portfolio_id=portfolio_id,
                period_days=period_days,
                history=history_points,
                total_return=total_return,
                total_return_percent=total_return_percent,
                generated_at=datetime.utcnow()
            )
            
        except Exception as e:
            print(f"Error getting portfolio history: {e}")
            return None
    
    @staticmethod
    async def _calculate_daily_returns(db: AsyncSession, portfolio_id: int, period_days: int) -> List[float]:
        """Calculate daily returns for the portfolio."""
        try:
            # This is a simplified calculation
            # In a real implementation, you'd track daily portfolio values
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get trades in period
            trades_result = await db.execute(
                select(Trade).where(
                    and_(
                        Trade.portfolio_id == portfolio_id,
                        Trade.created_at >= start_date
                    )
                ).order_by(Trade.created_at.asc())
            )
            trades = trades_result.scalars().all()
            
            # Calculate daily returns (simplified)
            daily_returns = []
            for i in range(period_days):
                # Simple random walk for demonstration
                # Replace with actual portfolio value changes
                daily_return = sum(
                    float(trade.total_amount) * (1 if trade.trade_type == 'sell' else -1)
                    for trade in trades
                    if trade.created_at.date() == (datetime.utcnow() - timedelta(days=period_days-i)).date()
                ) / 100000.0  # Normalize by portfolio size
                
                daily_returns.append(daily_return)
            
            return daily_returns
            
        except Exception as e:
            print(f"Error calculating daily returns: {e}")
            return []
    
    @staticmethod
    def _calculate_volatility(returns: List[float]) -> float:
        """Calculate portfolio volatility (standard deviation of returns)."""
        if len(returns) < 2:
            return 0.0
        
        mean_return = sum(returns) / len(returns)
        variance = sum((r - mean_return) ** 2 for r in returns) / (len(returns) - 1)
        volatility = math.sqrt(variance) * math.sqrt(252)  # Annualized
        
        return volatility * 100  # Return as percentage
    
    @staticmethod
    def _calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe ratio."""
        if not returns:
            return 0.0
        
        mean_return = sum(returns) / len(returns) * 252  # Annualized
        volatility = PortfolioService._calculate_volatility(returns) / 100  # Convert back to decimal
        
        if volatility == 0:
            return 0.0
        
        return (mean_return - risk_free_rate) / volatility
    
    @staticmethod
    def _calculate_max_drawdown(returns: List[float]) -> float:
        """Calculate maximum drawdown."""
        if not returns:
            return 0.0
        
        cumulative_returns = []
        cumulative = 1.0
        for ret in returns:
            cumulative *= (1 + ret)
            cumulative_returns.append(cumulative)
        
        peak = cumulative_returns[0]
        max_drawdown = 0.0
        
        for value in cumulative_returns:
            if value > peak:
                peak = value
            
            drawdown = (peak - value) / peak
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        return max_drawdown * 100  # Return as percentage
    
    @staticmethod
    async def update_all_portfolios(db: AsyncSession) -> Dict[str, int]:
        """Update values for all active portfolios (for background tasks)."""
        try:
            # Get all portfolios
            portfolios_result = await db.execute(select(Portfolio))
            portfolios = portfolios_result.scalars().all()
            
            updated_count = 0
            error_count = 0
            
            for portfolio in portfolios:
                try:
                    value = await PortfolioService.calculate_portfolio_value(db, portfolio.id)
                    if value:
                        # Update portfolio's current value (you might want to store this)
                        updated_count += 1
                    else:
                        error_count += 1
                except Exception as e:
                    print(f"Error updating portfolio {portfolio.id}: {e}")
                    error_count += 1
            
            return {
                "updated": updated_count,
                "errors": error_count,
                "total": len(portfolios)
            }
            
        except Exception as e:
            print(f"Error updating portfolios: {e}")
            return {"updated": 0, "errors": 0, "total": 0}
    
    @staticmethod
    async def get_position_history(
        db: AsyncSession, 
        portfolio_id: int, 
        symbol: str
    ) -> List[Dict]:
        """Get trading history for a specific position."""
        try:
            from ..trading.models import Trade  # Import here to avoid circular imports
            
            # Get all trades for this symbol
            trades_result = await db.execute(
                select(Trade).where(
                    and_(
                        Trade.portfolio_id == portfolio_id,
                        Trade.symbol == symbol
                    )
                ).order_by(Trade.created_at.desc())
            )
            trades = trades_result.scalars().all()
            
            history = []
            for trade in trades:
                history.append({
                    "date": trade.created_at.isoformat(),
                    "type": trade.trade_type,
                    "quantity": trade.quantity,
                    "price": float(trade.price),
                    "total": float(trade.total_amount),
                    "fees": float(trade.fees) if trade.fees else 0
                })
            
            return history
            
        except Exception as e:
            print(f"Error getting position history: {e}")
            return []


class RealTimePortfolioUpdater:
    """Background service for real-time portfolio updates."""
    
    def __init__(self, db_session_factory):
        self.db_session_factory = db_session_factory
        self.update_interval = 60  # Update every minute
        self.is_running = False
    
    async def start(self):
        """Start the real-time update service."""
        self.is_running = True
        while self.is_running:
            try:
                async with self.db_session_factory() as db:
                    result = await PortfolioService.update_all_portfolios(db)
                    print(f"Portfolio update: {result}")
                
                await asyncio.sleep(self.update_interval)
                
            except Exception as e:
                print(f"Error in portfolio updater: {e}")
                await asyncio.sleep(self.update_interval)
    
    def stop(self):
        """Stop the real-time update service."""
        self.is_running = False
