"""
Social features schemas for TradePulse.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class UserPublicProfile(BaseModel):
    """Public user profile schema."""
    id: int
    username: str
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    member_since: datetime
    
    # Trading statistics
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    total_profit_loss: Decimal = Decimal('0.00')
    competition_wins: int = 0
    competition_participations: int = 0
    current_streak: int = 0
    best_streak: int = 0
    rank_points: int = 1000
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User statistics schema."""
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_profit_loss: Decimal
    best_trade_profit: Decimal
    worst_trade_loss: Decimal
    competition_wins: int
    competition_participations: int
    current_streak: int
    best_streak: int
    rank_points: int
    
    class Config:
        from_attributes = True


class FriendRequest(BaseModel):
    """Friend request schema."""
    addressee_username: str


class FriendshipResponse(BaseModel):
    """Friendship response schema."""
    id: int
    requester: UserPublicProfile
    addressee: UserPublicProfile
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class CompetitionCreate(BaseModel):
    """Competition creation schema."""
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    starting_balance: Decimal = Field(default=Decimal('10000.00'), gt=0)
    duration_hours: int = Field(default=48, ge=1, le=168)  # 1 hour to 1 week
    max_participants: int = Field(default=10, ge=2, le=100)
    is_public: bool = True


class CompetitionResponse(BaseModel):
    """Competition response schema."""
    id: int
    name: str
    description: Optional[str]
    creator: UserPublicProfile
    starting_balance: Decimal
    start_date: datetime
    end_date: datetime
    status: str
    max_participants: int
    current_participants: int
    is_public: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class CompetitionParticipantResponse(BaseModel):
    """Competition participant response schema."""
    id: int
    user: UserPublicProfile
    starting_balance: Decimal
    current_balance: Decimal
    total_return: Decimal
    return_percentage: Decimal
    rank: Optional[int]
    trades_count: int
    status: str
    joined_at: datetime
    
    class Config:
        from_attributes = True


class CompetitionLeaderboard(BaseModel):
    """Competition leaderboard schema."""
    competition: CompetitionResponse
    participants: List[CompetitionParticipantResponse]
    
    class Config:
        from_attributes = True


class CompetitionTradeResponse(BaseModel):
    """Competition trade response schema."""
    id: int
    symbol: str
    trade_type: str
    quantity: int
    price: Decimal
    total_amount: Decimal
    profit_loss: Optional[Decimal]
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserSearch(BaseModel):
    """User search result schema."""
    id: int
    username: Optional[str]  # Make username optional since users might not have it set
    email: str  # Add email to search results
    full_name: Optional[str]
    profile_picture_url: Optional[str]
    rank_points: int
    competition_wins: int
    is_friend: bool
    friendship_status: Optional[str]  # None, 'pending', 'accepted'
    
    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    """Profile update request schema."""
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    is_profile_public: Optional[bool] = True
