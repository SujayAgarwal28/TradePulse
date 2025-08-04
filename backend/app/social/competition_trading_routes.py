"""
Competition Trading routes - separate from personal trading.
"""
from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_

from ..database import get_db, User, CompetitionParticipant, CompetitionTrade, Competition
from ..auth.routes import get_current_user
from ..trading.schemas import TradeRequest, TradeResponse, OrderType
from .competition_trading_service import CompetitionTradingService

router = APIRouter(prefix="/competitions", tags=["competition-trading"])
competition_trading_service = CompetitionTradingService()


@router.post("/{competition_id}/trade", response_model=TradeResponse)
async def execute_competition_trade(
    competition_id: int,
    trade_request: TradeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Execute a trade within a competition portfolio."""
    
    # Check if user is participant in this competition
    participant_result = await db.execute(
        select(CompetitionParticipant).where(
            and_(
                CompetitionParticipant.competition_id == competition_id,
                CompetitionParticipant.user_id == current_user.id
            )
        )
    )
    participant = participant_result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant in this competition")
    
    # Check if competition is active
    competition_result = await db.execute(
        select(Competition).where(Competition.id == competition_id)
    )
    competition = competition_result.scalar_one_or_none()
    
    if not competition or competition.status != "active":
        raise HTTPException(status_code=400, detail="Competition is not active")
    
    # Execute the trade
    result = await competition_trading_service.execute_competition_trade(
        db, participant, trade_request
    )
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return result


@router.get("/{competition_id}/portfolio")
async def get_competition_portfolio(
    competition_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get user's portfolio within a specific competition."""
    
    # Check if user is participant
    participant_result = await db.execute(
        select(CompetitionParticipant).where(
            and_(
                CompetitionParticipant.competition_id == competition_id,
                CompetitionParticipant.user_id == current_user.id
            )
        )
    )
    participant = participant_result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant in this competition")
    
    # Get competition portfolio data
    portfolio_data = await competition_trading_service.get_competition_portfolio(
        db, participant
    )
    
    return portfolio_data


@router.get("/{competition_id}/trades")
async def get_competition_trades(
    competition_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get user's trades within a specific competition."""
    
    # Check if user is participant
    participant_result = await db.execute(
        select(CompetitionParticipant).where(
            and_(
                CompetitionParticipant.competition_id == competition_id,
                CompetitionParticipant.user_id == current_user.id
            )
        )
    )
    participant = participant_result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant in this competition")
    
    # Get trades for this participant
    trades_result = await db.execute(
        select(CompetitionTrade)
        .where(CompetitionTrade.participant_id == participant.id)
        .order_by(desc(CompetitionTrade.created_at))
    )
    trades = trades_result.scalars().all()
    
    return {"trades": trades}


@router.post("/{competition_id}/buy")
async def buy_competition_stock(
    competition_id: int,
    symbol: str,
    quantity: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Quick buy endpoint for competition."""
    trade_request = TradeRequest(symbol=symbol, quantity=quantity, order_type=OrderType.BUY)
    return await execute_competition_trade(competition_id, trade_request, current_user, db)


@router.post("/{competition_id}/sell")
async def sell_competition_stock(
    competition_id: int,
    symbol: str,
    quantity: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Quick sell endpoint for competition."""
    trade_request = TradeRequest(symbol=symbol, quantity=quantity, order_type=OrderType.SELL)
    return await execute_competition_trade(competition_id, trade_request, current_user, db)
