"""
Authentication service for TradePulse.
Handles user registration, login, JWT tokens, and user management.
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import User, Portfolio, UserPreferences
from .schemas import UserCreate, UserLogin, Token, UserProfileUpdate, UserPreferencesUpdate, PasswordChangeRequest

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for handling user authentication and authorization."""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """Verify a JWT token and return the username."""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                return None
            return username
        except JWTError:
            return None
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password."""
        user = await AuthService.get_user_by_email(db, email)
        if not user:
            return None
        if not AuthService.verify_password(password, user.hashed_password):
            return None
        return user
    
    @staticmethod
    async def create_user(db: AsyncSession, user_create: UserCreate) -> User:
        """Create a new user with a portfolio."""
        # Check if user already exists
        existing_user = await AuthService.get_user_by_email(db, user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = AuthService.get_password_hash(user_create.password)
        db_user = User(
            email=user_create.email,
            hashed_password=hashed_password,
        )
        db.add(db_user)
        await db.flush()  # Flush to get the user ID
        
        # Create portfolio with $100,000 starting balance
        portfolio = Portfolio(
            user_id=db_user.id,
            cash_balance=100000.00,
            total_value=100000.00,
            total_invested=0.00,
            total_returns=0.00
        )
        db.add(portfolio)
        
        await db.commit()
        await db.refresh(db_user)
        return db_user
    
    @staticmethod
    async def login_user(db: AsyncSession, user_login: UserLogin) -> Token:
        """Login a user and return JWT token."""
        user = await AuthService.authenticate_user(db, user_login.email, user_login.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    # Profile Management Methods (Phase 2B)
    @staticmethod
    async def update_user_profile(db: AsyncSession, user_id: int, profile_update: UserProfileUpdate) -> User:
        """Update user profile information."""
        user = await AuthService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check username uniqueness if provided
        if profile_update.username:
            existing_user = await db.execute(
                select(User).where(User.username == profile_update.username, User.id != user_id)
            )
            if existing_user.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Update fields
        update_data = profile_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def get_user_preferences(db: AsyncSession, user_id: int) -> UserPreferences:
        """Get user preferences, create if not exists."""
        result = await db.execute(
            select(UserPreferences).where(UserPreferences.user_id == user_id)
        )
        preferences = result.scalar_one_or_none()
        
        if not preferences:
            # Create default preferences
            preferences = UserPreferences(user_id=user_id)
            db.add(preferences)
            await db.commit()
            await db.refresh(preferences)
        
        return preferences
    
    @staticmethod
    async def update_user_preferences(db: AsyncSession, user_id: int, preferences_update: UserPreferencesUpdate) -> UserPreferences:
        """Update user preferences."""
        preferences = await AuthService.get_user_preferences(db, user_id)
        
        # Update fields
        update_data = preferences_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(preferences, field, value)
        
        preferences.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(preferences)
        return preferences
    
    @staticmethod
    async def change_password(db: AsyncSession, user_id: int, password_change: PasswordChangeRequest) -> bool:
        """Change user password."""
        user = await AuthService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not AuthService.verify_password(password_change.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        user.hashed_password = AuthService.get_password_hash(password_change.new_password)
        user.updated_at = datetime.utcnow()
        await db.commit()
        return True
    
    @staticmethod
    async def reset_portfolio(db: AsyncSession, user_id: int, confirmation: bool) -> bool:
        """Reset user portfolio to initial state."""
        if not confirmation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Portfolio reset must be confirmed"
            )
        
        user = await AuthService.get_user_by_id(db, user_id)
        if not user or not user.portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User or portfolio not found"
            )
        
        # Reset portfolio values
        portfolio = user.portfolio
        portfolio.cash_balance = 100000.00
        portfolio.total_value = 100000.00
        portfolio.total_invested = 0.00
        portfolio.total_returns = 0.00
        portfolio.updated_at = datetime.utcnow()
        
        # Update preferences to track reset
        preferences = await AuthService.get_user_preferences(db, user_id)
        preferences.portfolio_reset_count += 1
        preferences.last_reset_date = datetime.utcnow()
        preferences.updated_at = datetime.utcnow()
        
        # Note: In a full implementation, you'd also want to:
        # - Clear all positions
        # - Archive trade history
        # - Reset related metrics
        
        await db.commit()
        return True
