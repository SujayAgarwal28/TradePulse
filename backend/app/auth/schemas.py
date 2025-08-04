"""
Authentication schemas for TradePulse API.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    """Schema for token data."""
    email: Optional[str] = None


class UserWithPortfolio(UserResponse):
    """Schema for user with portfolio information."""
    portfolio_id: Optional[int] = None
    cash_balance: Optional[float] = None
    total_value: Optional[float] = None
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user creation."""
    password: str


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class User(UserBase):
    """Schema for user response."""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for authentication token."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token data."""
    email: Optional[str] = None


# Profile schemas (Phase 2B)
class UserProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    username: Optional[str] = Field(None, max_length=50, description="Unique username")
    full_name: Optional[str] = Field(None, max_length=100, description="User's full name")
    bio: Optional[str] = Field(None, max_length=500, description="User biography")
    profile_picture_url: Optional[str] = Field(None, description="Profile picture URL")


class UserProfileResponse(UserResponse):
    """Schema for user profile response."""
    username: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""
    theme: Optional[str] = Field(None, pattern="^(dark|light)$", description="UI theme preference")
    email_notifications: Optional[bool] = Field(None, description="Email notification preference")


class UserPreferencesResponse(BaseModel):
    """Schema for user preferences response."""
    theme: str = "dark"
    email_notifications: bool = True
    portfolio_reset_count: int = 0
    last_reset_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PasswordChangeRequest(BaseModel):
    """Schema for password change."""
    current_password: str = Field(..., description="Current password for verification")
    new_password: str = Field(..., min_length=6, description="New password must be at least 6 characters")


class PortfolioResetRequest(BaseModel):
    """Schema for portfolio reset confirmation."""
    confirmation: bool = Field(..., description="User must confirm portfolio reset")
    reset_message: str = Field(..., description="User must type confirmation message")
