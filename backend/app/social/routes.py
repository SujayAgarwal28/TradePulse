"""
Social features routes for TradePulse.
"""
import logging
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db, Competition, CompetitionParticipant
from ..auth.dependencies import get_current_user
from .schemas import (
    UserPublicProfile, FriendRequest, ProfileUpdateRequest, 
    UserSearch, CompetitionCreate
)
from .services import social_service
from .competition_services import competition_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/social", tags=["social"])


@router.get("/profile/{user_id}", response_model=UserPublicProfile)
async def get_user_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a user's public profile."""
    profile = await social_service.get_user_public_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile


@router.get("/profile", response_model=UserPublicProfile)
async def get_my_profile(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's profile."""
    profile = await social_service.get_user_public_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/profile")
async def update_my_profile(
    profile_data: ProfileUpdateRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile."""
    success = await social_service.update_user_profile(db, current_user.id, profile_data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    return {"message": "Profile updated successfully"}


@router.get("/search", response_model=List[UserSearch])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search for users by username or name."""
    results = await social_service.search_users(db, current_user.id, q, limit)
    return results


@router.post("/friends/request")
async def send_friend_request(
    friend_request: FriendRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a friend request to another user."""
    success = await social_service.send_friend_request(
        db, current_user.id, friend_request.addressee_username
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to send friend request")
    return {"message": "Friend request sent successfully"}


@router.get("/friends/requests")
async def get_friend_requests(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pending friend requests."""
    requests = await social_service.get_friend_requests(db, current_user.id)
    return {"requests": requests}


@router.post("/friends/requests/{request_id}/respond")
async def respond_to_friend_request(
    request_id: int,
    accept: bool,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accept or reject a friend request."""
    success = await social_service.respond_to_friend_request(
        db, current_user.id, request_id, accept
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to respond to friend request")
    
    action = "accepted" if accept else "rejected"
    return {"message": f"Friend request {action} successfully"}


@router.get("/friends", response_model=List[UserPublicProfile])
async def get_friends_list(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's friends list."""
    friends = await social_service.get_friends_list(db, current_user.id)
    return friends


# Competition routes
@router.post("/competitions")
async def create_competition(
    competition_data: CompetitionCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new trading competition."""
    competition_id = await competition_service.create_competition(
        db, current_user.id, competition_data
    )
    if not competition_id:
        raise HTTPException(status_code=400, detail="Failed to create competition")
    return {"competition_id": competition_id, "message": "Competition created successfully"}


@router.get("/competitions")
async def get_active_competitions(
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get list of active/upcoming competitions."""
    competitions = await competition_service.get_active_competitions(db, limit)
    return {"competitions": competitions}


@router.post("/competitions/{competition_id}/join")
async def join_competition(
    competition_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Join a trading competition."""
    result = await competition_service.join_competition(db, competition_id, current_user.id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to join competition"))
    
    return {"message": result.get("message", "Successfully joined competition")}


@router.get("/competitions/{competition_id}/leaderboard")
async def get_competition_leaderboard(
    competition_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get competition leaderboard."""
    leaderboard = await competition_service.get_competition_leaderboard(db, competition_id)
    if not leaderboard:
        raise HTTPException(status_code=404, detail="Competition not found")
    return leaderboard


@router.get("/competitions/my")
async def get_my_competitions(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get competitions that current user has joined."""
    competitions = await competition_service.get_user_competitions(db, current_user.id)
    return {"competitions": competitions}


@router.get("/competitions/{competition_id}")
async def get_competition_details(
    competition_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed competition information."""
    try:
        comp_query = select(Competition).options(
            selectinload(Competition.creator),
            selectinload(Competition.participants).selectinload(CompetitionParticipant.user)
        ).where(Competition.id == competition_id)
        
        comp_result = await db.execute(comp_query)
        competition = comp_result.scalar_one_or_none()
        
        if not competition:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        # Get participant count
        participants_count = len(competition.participants)
        
        # Calculate time remaining
        now = datetime.utcnow()
        time_remaining = None
        if competition.status == "upcoming":
            time_remaining = (competition.start_date - now).total_seconds()
        elif competition.status == "active":
            time_remaining = (competition.end_date - now).total_seconds()
        
        return {
            "id": competition.id,
            "name": competition.name,
            "description": competition.description,
            "creator": {
                "id": competition.creator.id,
                "username": competition.creator.username or f"trader_{competition.creator.id}",
                "full_name": competition.creator.full_name
            },
            "status": competition.status,
            "start_date": competition.start_date,
            "end_date": competition.end_date,
            "starting_balance": float(competition.starting_balance),
            "max_participants": competition.max_participants,
            "current_participants": participants_count,
            "is_public": competition.is_public,
            "time_remaining_seconds": max(0, time_remaining) if time_remaining else None,
            "created_at": competition.created_at
        }
        
    except Exception as e:
        logger.error(f"Error getting competition details: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
