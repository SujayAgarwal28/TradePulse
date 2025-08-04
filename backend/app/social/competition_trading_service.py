"""
Competition Trading Service - manages tradin                
                          
                # Update participant balance
                participant.current_balance += total_amount   # Update participant balance
                participant.current_balance -= total_amountithin competitions.
"""
from typing import Dict, List, Optional
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import datetime

from ..database import CompetitionParticipant, CompetitionTrade, Competition
from ..trading.schemas import TradeRequest, TradeResponse, OrderType
from ..stocks.robust_services import stock_service


class CompetitionTradingService:
    """Service for handling competition-specific trading."""
    
    async def execute_competition_trade(
        self, 
        db: AsyncSession, 
        participant: CompetitionParticipant, 
        trade_request: TradeRequest
    ) -> TradeResponse:
        """Execute a trade within a competition."""
        
        try:
            # Get live stock price
            stock_data = await stock_service.get_stock_info(trade_request.symbol)
            if not stock_data:
                return TradeResponse(
                    success=False,
                    message=f"Could not get price data for {trade_request.symbol}",
                    trade_id=None,
                    executed_price=0.0,
                    total_amount=0.0
                )
            
            current_price = float(stock_data.current_price)
            trade_value = current_price * trade_request.quantity
            brokerage = trade_value * 0.0005  # 0.05% brokerage charge
            total_cost = trade_value + brokerage  # For BUY: cost includes brokerage
            net_proceeds = trade_value - brokerage  # For SELL: proceeds after brokerage
            
            if trade_request.order_type == OrderType.BUY:
                # Check if participant has enough cash (including brokerage)
                if float(participant.current_balance) < total_cost:
                    return TradeResponse(
                        success=False,
                        message=f"Insufficient cash. Need ${total_cost:,.2f} (including brokerage), have ${float(participant.current_balance):,.2f}",
                        trade_id=None,
                        executed_price=current_price,
                        total_amount=trade_value,
                        fees=brokerage
                    )
                
                # Update participant cash (deduct total cost including brokerage)
                participant.current_balance = participant.current_balance - Decimal(str(total_cost))
                
                # Create trade record
                trade = CompetitionTrade(
                    competition_id=participant.competition_id,
                    participant_id=participant.id,
                    user_id=participant.user_id,
                    symbol=trade_request.symbol,
                    trade_type="BUY",
                    quantity=trade_request.quantity,
                    price=Decimal(str(current_price)),
                    total_amount=Decimal(str(trade_value)),
                    created_at=datetime.utcnow()
                )
                
            else:  # SELL
                # Check if participant has enough shares
                current_position = await self._get_current_position(db, participant.id, trade_request.symbol)
                if current_position < trade_request.quantity:
                    return TradeResponse(
                        success=False,
                        message=f"Insufficient shares. Need {trade_request.quantity}, have {current_position}",
                        trade_id=None,
                        executed_price=current_price,
                        total_amount=trade_value,
                        fees=brokerage
                    )
                
                # Update participant cash (add net proceeds after brokerage)
                participant.current_balance = participant.current_balance + Decimal(str(net_proceeds))
                
                # Create trade record
                trade = CompetitionTrade(
                    competition_id=participant.competition_id,
                    participant_id=participant.id,
                    user_id=participant.user_id,
                    symbol=trade_request.symbol,
                    trade_type="SELL",
                    quantity=trade_request.quantity,
                    price=Decimal(str(current_price)),
                    total_amount=Decimal(str(trade_value)),
                    created_at=datetime.utcnow()
                )
            
            # Save to database
            db.add(trade)
            await db.commit()
            await db.refresh(trade)
            
            # Update participant's current value
            await self._update_participant_value(db, participant)
            
            return TradeResponse(
                success=True,
                message=f"Successfully {trade_request.order_type.lower()}ed {trade_request.quantity} shares of {trade_request.symbol}",
                trade_id=trade.id,
                executed_price=current_price,
                total_amount=trade_value,
                fees=brokerage
            )
            
        except Exception as e:
            await db.rollback()
            return TradeResponse(
                success=False,
                message=f"Trade execution failed: {str(e)}",
                trade_id=None,
                executed_price=0.0,
                total_amount=0.0
            )
    
    async def get_competition_portfolio(
        self, 
        db: AsyncSession, 
        participant: CompetitionParticipant
    ) -> Dict:
        """Get participant's portfolio within the competition."""
        
        # Get all positions
        positions = await self._get_all_positions(db, participant.id)
        
        # Calculate total portfolio value
        total_stock_value = 0.0
        position_details = []
        
        for symbol, quantity in positions.items():
            if quantity > 0:
                stock_data = await stock_service.get_stock_info(symbol)
                if stock_data:
                    current_value = float(stock_data.current_price * quantity)
                    total_stock_value += current_value
                    
                    # Get average buy price
                    avg_price = await self._get_average_buy_price(db, participant.id, symbol)
                    
                    position_details.append({
                        "symbol": symbol,
                        "quantity": quantity,
                        "current_price": stock_data.current_price,
                        "current_value": current_value,
                        "average_price": float(avg_price) if avg_price else 0.0,
                        "profit_loss": current_value - (float(avg_price) * quantity) if avg_price else 0.0,
                        "profit_loss_percentage": ((float(stock_data.current_price) - float(avg_price)) / float(avg_price) * 100) if avg_price and avg_price > 0 else 0.0
                    })
        
        total_value = float(participant.current_balance) + total_stock_value
        starting_balance = float(participant.starting_balance)
        profit_loss = total_value - starting_balance
        
        # Calculate percentage safely to avoid division by zero
        if starting_balance > 0:
            profit_loss_percentage = (profit_loss / starting_balance) * 100
        else:
            profit_loss_percentage = 0.0
        
        # Add debugging info
        print(f"DEBUG Portfolio Calculation:")
        print(f"  - Current Balance: ${participant.current_balance}")
        print(f"  - Stock Value: ${total_stock_value}")
        print(f"  - Total Value: ${total_value}")
        print(f"  - Starting Balance: ${starting_balance}")
        print(f"  - Profit/Loss: ${profit_loss}")
        print(f"  - Profit/Loss %: {profit_loss_percentage:.2f}%")
        
        return {
            "cash_balance": float(participant.current_balance),
            "total_stock_value": total_stock_value,
            "total_value": total_value,
            "starting_balance": starting_balance,
            "profit_loss": profit_loss,
            "profit_loss_percentage": profit_loss_percentage,
            "positions": position_details
        }
    
    async def _get_current_position(self, db: AsyncSession, participant_id: int, symbol: str) -> int:
        """Get current quantity of a stock for a participant."""
        buy_result = await db.execute(
            select(func.sum(CompetitionTrade.quantity))
            .where(
                and_(
                    CompetitionTrade.participant_id == participant_id,
                    CompetitionTrade.symbol == symbol,
                    CompetitionTrade.trade_type == "BUY"
                )
            )
        )
        buy_quantity = buy_result.scalar() or 0
        
        sell_result = await db.execute(
            select(func.sum(CompetitionTrade.quantity))
            .where(
                and_(
                    CompetitionTrade.participant_id == participant_id,
                    CompetitionTrade.symbol == symbol,
                    CompetitionTrade.trade_type == "SELL"
                )
            )
        )
        sell_quantity = sell_result.scalar() or 0
        
        return buy_quantity - sell_quantity
    
    async def _get_all_positions(self, db: AsyncSession, participant_id: int) -> Dict[str, int]:
        """Get all current positions for a participant."""
        trades_result = await db.execute(
            select(CompetitionTrade)
            .where(CompetitionTrade.participant_id == participant_id)
        )
        trades = trades_result.scalars().all()
        
        positions = {}
        for trade in trades:
            if trade.symbol not in positions:
                positions[trade.symbol] = 0
            
            if trade.trade_type == "BUY":
                positions[trade.symbol] += trade.quantity
            else:  # SELL
                positions[trade.symbol] -= trade.quantity
        
        return positions
    
    async def _get_average_buy_price(self, db: AsyncSession, participant_id: int, symbol: str) -> float:
        """Get average buy price for a symbol."""
        buy_trades_result = await db.execute(
            select(CompetitionTrade)
            .where(
                and_(
                    CompetitionTrade.participant_id == participant_id,
                    CompetitionTrade.symbol == symbol,
                    CompetitionTrade.trade_type == "BUY"
                )
            )
        )
        buy_trades = buy_trades_result.scalars().all()
        
        if not buy_trades:
            return 0.0
        
        total_cost = sum(trade.total_amount for trade in buy_trades)
        total_quantity = sum(trade.quantity for trade in buy_trades)
        
        return total_cost / total_quantity if total_quantity > 0 else 0.0
    
    async def _update_participant_value(self, db: AsyncSession, participant: CompetitionParticipant):
        """Update participant's current portfolio value."""
        portfolio_data = await self.get_competition_portfolio(db, participant)
        participant.current_value = portfolio_data["total_value"]
        participant.profit_loss = portfolio_data["profit_loss"]
        participant.profit_loss_percentage = portfolio_data["profit_loss_percentage"]
        
        await db.commit()


# Global instance
competition_trading_service = CompetitionTradingService()
