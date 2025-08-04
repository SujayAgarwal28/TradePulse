"""
Authentication routes for user registration and login.
"""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db, User, Portfolio
from .schemas import (
    UserCreate, User as UserSchema, Token, UserProfileUpdate, UserProfileResponse,
    UserPreferencesUpdate, UserPreferencesResponse, PasswordChangeRequest, PortfolioResetRequest,
    UserLogin
)
from .services import AuthService
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_user_by_email(db: AsyncSession, email: str) -> User:
    """Get user by email."""
    return await AuthService.get_user_by_email(db, email)


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """Authenticate user with email and password."""
    return await AuthService.authenticate_user(db, email, password)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = AuthService.verify_token(token)
    if email is None:
        raise credentials_exception
    
    user = await get_user_by_email(db, email)
    if user is None:
        raise credentials_exception
    
    return user


@router.post("/register", response_model=UserSchema)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    return await AuthService.create_user(db, user_data)


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    """Login user and return access token."""
    user_login = UserLogin(email=form_data.username, password=form_data.password)
    return await AuthService.login_user(db, user_login)


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Get current user information."""
    return current_user


# Profile Management Routes (Phase 2B)
@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Get current user profile information."""
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update user profile information."""
    return await AuthService.update_user_profile(db, current_user.id, profile_update)


@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get user preferences."""
    return await AuthService.get_user_preferences(db, current_user.id)


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update user preferences."""
    return await AuthService.update_user_preferences(db, current_user.id, preferences_update)


@router.post("/change-password")
async def change_password(
    password_change: PasswordChangeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Change user password."""
    success = await AuthService.change_password(db, current_user.id, password_change)
    return {"message": "Password changed successfully"}


@router.post("/reset-portfolio")
async def reset_portfolio(
    reset_request: PortfolioResetRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Reset user portfolio to initial state."""
    if reset_request.reset_message.lower() != "reset my portfolio":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation message must be exactly 'reset my portfolio'"
        )
    
    success = await AuthService.reset_portfolio(db, current_user.id, reset_request.confirmation)
    return {"message": "Portfolio reset successfully"}
