"""
Database configuration and models for TradePulse.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, relationship

from .config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for all models
Base = declarative_base()


class User(Base):
    """User model for authentication and profile management."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Profile fields (Phase 2B)
    username = Column(String(50), unique=True, nullable=True)
    full_name = Column(String(100), nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="user", uselist=False)
    trades = relationship("Trade", back_populates="user")
    positions = relationship("Position", back_populates="user")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False)
    stats = relationship("UserStats", back_populates="user", uselist=False)


class Portfolio(Base):
    """Portfolio model for tracking user's virtual money and performance."""
    
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    cash_balance = Column(Numeric(15, 2), default=100000.00)  # Starting with $100k
    total_value = Column(Numeric(15, 2), default=100000.00)
    total_invested = Column(Numeric(15, 2), default=0.00)
    total_returns = Column(Numeric(15, 2), default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="portfolio")


class Stock(Base):
    """Stock model for caching stock information."""
    
    __tablename__ = "stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    current_price = Column(Numeric(10, 2))
    previous_close = Column(Numeric(10, 2))
    market_cap = Column(Numeric(20, 2))
    sector = Column(String)
    last_updated = Column(DateTime, default=datetime.utcnow)


class Trade(Base):
    """Trade model for recording all buy/sell transactions."""
    
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    trade_type = Column(String, nullable=False)  # 'buy' or 'sell'
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    fees = Column(Numeric(8, 2), default=0.00)
    status = Column(String, default="completed")  # 'pending', 'completed', 'failed', 'cancelled'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Keep old field for backward compatibility
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="trades")


class Position(Base):
    """Position model for tracking current holdings."""
    
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    average_cost = Column(Numeric(10, 2), nullable=False)  # Changed from average_price
    current_value = Column(Numeric(15, 2))
    unrealized_pnl = Column(Numeric(15, 2))
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Keep old field for backward compatibility
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    average_price = Column(Numeric(10, 2))  # Kept for backward compatibility
    
    # Relationships
    user = relationship("User", back_populates="positions")


class UserPreferences(Base):
    """User preferences model for storing user settings."""
    
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    theme = Column(String(20), default="dark")
    email_notifications = Column(Boolean, default=True)
    portfolio_reset_count = Column(Integer, default=0)
    last_reset_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="preferences")


class UserStats(Base):
    """User statistics model for tracking trading performance and wins."""
    
    __tablename__ = "user_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_trades = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    losing_trades = Column(Integer, default=0)
    total_profit_loss = Column(Numeric(15, 2), default=0.00)
    best_trade_profit = Column(Numeric(15, 2), default=0.00)
    worst_trade_loss = Column(Numeric(15, 2), default=0.00)
    competition_wins = Column(Integer, default=0)
    competition_participations = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)  # Current winning/losing streak
    best_streak = Column(Integer, default=0)     # Best winning streak
    rank_points = Column(Integer, default=1000)  # ELO-style rating system
    is_profile_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="stats")


class Friendship(Base):
    """Friendship model for managing friend connections."""
    
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    addressee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # 'pending', 'accepted', 'blocked'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id])
    addressee = relationship("User", foreign_keys=[addressee_id])


class Competition(Base):
    """Competition model for managing trading contests."""
    
    __tablename__ = "competitions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    starting_balance = Column(Numeric(15, 2), default=10000.00)  # $10k starting balance
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="upcoming")  # 'upcoming', 'active', 'completed', 'cancelled'
    max_participants = Column(Integer, default=10)
    entry_fee = Column(Numeric(10, 2), default=0.00)  # Future feature
    prize_pool = Column(Numeric(15, 2), default=0.00)  # Future feature
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User")
    participants = relationship("CompetitionParticipant", back_populates="competition")


class CompetitionParticipant(Base):
    """Competition participant model for tracking user performance in contests."""
    
    __tablename__ = "competition_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    starting_balance = Column(Numeric(15, 2), nullable=False)
    current_balance = Column(Numeric(15, 2), nullable=False)
    total_return = Column(Numeric(15, 2), default=0.00)
    return_percentage = Column(Numeric(8, 4), default=0.00)
    rank = Column(Integer, nullable=True)
    trades_count = Column(Integer, default=0)
    status = Column(String(20), default="active")  # 'active', 'eliminated', 'completed'
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_trade_at = Column(DateTime, nullable=True)
    
    # Relationships
    competition = relationship("Competition", back_populates="participants")
    user = relationship("User")


class CompetitionTrade(Base):
    """Competition trade model for tracking trades within competitions."""
    
    __tablename__ = "competition_trades"
    
    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id"), nullable=False)
    participant_id = Column(Integer, ForeignKey("competition_participants.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    trade_type = Column(String, nullable=False)  # 'buy' or 'sell'
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    profit_loss = Column(Numeric(15, 2), nullable=True)  # Calculated when position is closed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    competition = relationship("Competition")
    participant = relationship("CompetitionParticipant")
    user = relationship("User")


async def get_db():
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
