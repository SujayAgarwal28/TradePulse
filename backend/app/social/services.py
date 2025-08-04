"""
Social features services for TradePulse.
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import (
    User, UserStats, Friendship, Competition, CompetitionParticipant, 
    CompetitionTrade, Trade, Portfolio
)
from .schemas import (
    UserPublicProfile, CompetitionCreate, FriendRequest, 
    ProfileUpdateRequest, UserSearch
)

logger = logging.getLogger(__name__)


class SocialService:
    """Service for managing social features."""
    
    @staticmethod
    async def get_user_public_profile(db: AsyncSession, user_id: int) -> Optional[UserPublicProfile]:
        """Get user's public profile information."""
        try:
            # Get user with stats
            from sqlalchemy import select
            
            query = select(User).options(selectinload(User.stats)).where(User.id == user_id)
            result = await db.execute(query)
            user = result.scalar_one_or_none()
            
            if not user:
                return None
            
            # Ensure user has stats
            if not user.stats:
                user_stats = UserStats(user_id=user_id)
                db.add(user_stats)
                await db.commit()
                await db.refresh(user_stats)
                user.stats = user_stats
            
            # Calculate win rate
            win_rate = 0.0
            if user.stats.total_trades > 0:
                win_rate = (user.stats.winning_trades / user.stats.total_trades) * 100
            
            return UserPublicProfile(
                id=user.id,
                username=user.username or f"trader_{user.id}",
                full_name=user.full_name,
                profile_picture_url=user.profile_picture_url,
                bio=user.bio,
                member_since=user.created_at,
                total_trades=user.stats.total_trades,
                winning_trades=user.stats.winning_trades,
                losing_trades=user.stats.losing_trades,
                win_rate=round(win_rate, 2),
                total_profit_loss=user.stats.total_profit_loss,
                competition_wins=user.stats.competition_wins,
                competition_participations=user.stats.competition_participations,
                current_streak=user.stats.current_streak,
                best_streak=user.stats.best_streak,
                rank_points=user.stats.rank_points
            )
            
        except Exception as e:
            logger.error(f"Error getting user public profile: {e}")
            return None
    
    @staticmethod
    async def update_user_profile(
        db: AsyncSession, 
        user_id: int, 
        profile_data: ProfileUpdateRequest
    ) -> bool:
        """Update user's profile information."""
        try:
            from sqlalchemy import select, update
            
            # Update user profile
            query = update(User).where(User.id == user_id).values(
                full_name=profile_data.full_name,
                bio=profile_data.bio,
                updated_at=datetime.utcnow()
            )
            await db.execute(query)
            
            # Update stats visibility
            if profile_data.is_profile_public is not None:
                stats_query = update(UserStats).where(UserStats.user_id == user_id).values(
                    is_profile_public=profile_data.is_profile_public
                )
                await db.execute(stats_query)
            
            await db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            await db.rollback()
            return False
    
    @staticmethod
    async def search_users(
        db: AsyncSession, 
        current_user_id: int, 
        query: str, 
        limit: int = 20
    ) -> List[UserSearch]:
        """Search for users by username or full name."""
        try:
            from sqlalchemy import select
            
            # First, let's just search users without requiring UserStats
            search_query = select(User).where(
                and_(
                    User.id != current_user_id,
                    User.is_active == True,
                    or_(
                        User.username.ilike(f"%{query}%"),
                        User.full_name.ilike(f"%{query}%"),
                        User.email.ilike(f"%{query}%")
                    )
                )
            ).limit(limit)
            
            result = await db.execute(search_query)
            users = result.scalars().all()
            
            # Now get UserStats for these users (create if missing)
            user_ids = [user.id for user in users]
            stats_query = select(UserStats).where(UserStats.user_id.in_(user_ids))
            stats_result = await db.execute(stats_query)
            user_stats_map = {stats.user_id: stats for stats in stats_result.scalars().all()}
            
            # Get friendship statuses
            friendship_query = select(Friendship).where(
                or_(
                    and_(
                        Friendship.requester_id == current_user_id,
                        Friendship.addressee_id.in_(user_ids)
                    ),
                    and_(
                        Friendship.addressee_id == current_user_id,
                        Friendship.requester_id.in_(user_ids)
                    )
                )
            )
            
            friendship_result = await db.execute(friendship_query)
            friendships = {
                (f.requester_id, f.addressee_id): f.status 
                for f in friendship_result.scalars().all()
            }
            
            # Build response
            search_results = []
            for user in users:
                # Get or create user stats
                stats = user_stats_map.get(user.id)
                if not stats:
                    stats = UserStats(user_id=user.id, rank_points=0, competition_wins=0)
                
                # Check friendship status
                friendship_key1 = (current_user_id, user.id)
                friendship_key2 = (user.id, current_user_id)
                friendship_status = friendships.get(friendship_key1) or friendships.get(friendship_key2)
                is_friend = friendship_status == "accepted"
                
                search_results.append(UserSearch(
                    id=user.id,
                    username=user.username,  # Allow None for username
                    email=user.email,  # Include email for search results
                    full_name=user.full_name,
                    profile_picture_url=user.profile_picture_url,
                    rank_points=stats.rank_points,
                    competition_wins=stats.competition_wins,
                    is_friend=is_friend,
                    friendship_status=friendship_status
                ))
            
            return search_results
            
        except Exception as e:
            logger.error(f"Error searching users: {e}")
            return []
    
    @staticmethod
    async def send_friend_request(
        db: AsyncSession, 
        requester_id: int, 
        addressee_username: str
    ) -> bool:
        """Send a friend request to another user."""
        try:
            from sqlalchemy import select
            
            # Find addressee by username
            addressee_query = select(User).where(User.username == addressee_username)
            result = await db.execute(addressee_query)
            addressee = result.scalar_one_or_none()
            
            if not addressee or addressee.id == requester_id:
                return False
            
            # Check if friendship already exists
            existing_query = select(Friendship).where(
                or_(
                    and_(
                        Friendship.requester_id == requester_id,
                        Friendship.addressee_id == addressee.id
                    ),
                    and_(
                        Friendship.requester_id == addressee.id,
                        Friendship.addressee_id == requester_id
                    )
                )
            )
            
            existing_result = await db.execute(existing_query)
            existing_friendship = existing_result.scalar_one_or_none()
            
            if existing_friendship:
                return False  # Friendship already exists
            
            # Create friend request
            friendship = Friendship(
                requester_id=requester_id,
                addressee_id=addressee.id,
                status="pending"
            )
            
            db.add(friendship)
            await db.commit()
            
            logger.info(f"Friend request sent from user {requester_id} to user {addressee.id}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending friend request: {e}")
            await db.rollback()
            return False
    
    @staticmethod
    async def get_friend_requests(db: AsyncSession, user_id: int) -> List[dict]:
        """Get pending friend requests for a user."""
        try:
            from sqlalchemy import select
            
            query = select(Friendship).options(
                selectinload(Friendship.requester),
                selectinload(Friendship.addressee)
            ).where(
                and_(
                    Friendship.addressee_id == user_id,
                    Friendship.status == "pending"
                )
            )
            
            result = await db.execute(query)
            requests = result.scalars().all()
            
            return [
                {
                    "id": req.id,
                    "requester": {
                        "id": req.requester.id,
                        "username": req.requester.username or f"trader_{req.requester.id}",
                        "full_name": req.requester.full_name,
                        "profile_picture_url": req.requester.profile_picture_url
                    },
                    "created_at": req.created_at
                }
                for req in requests
            ]
            
        except Exception as e:
            logger.error(f"Error getting friend requests: {e}")
            return []
    
    @staticmethod
    async def respond_to_friend_request(
        db: AsyncSession, 
        user_id: int, 
        request_id: int, 
        accept: bool
    ) -> bool:
        """Accept or reject a friend request."""
        try:
            from sqlalchemy import select, update
            
            # Get the friendship request
            query = select(Friendship).where(
                and_(
                    Friendship.id == request_id,
                    Friendship.addressee_id == user_id,
                    Friendship.status == "pending"
                )
            )
            
            result = await db.execute(query)
            friendship = result.scalar_one_or_none()
            
            if not friendship:
                return False
            
            # Update status
            new_status = "accepted" if accept else "rejected"
            update_query = update(Friendship).where(Friendship.id == request_id).values(
                status=new_status,
                updated_at=datetime.utcnow()
            )
            
            await db.execute(update_query)
            await db.commit()
            
            logger.info(f"Friend request {request_id} {new_status}")
            return True
            
        except Exception as e:
            logger.error(f"Error responding to friend request: {e}")
            await db.rollback()
            return False
    
    @staticmethod
    async def get_friends_list(db: AsyncSession, user_id: int) -> List[UserPublicProfile]:
        """Get user's friends list."""
        try:
            from sqlalchemy import select
            
            # Get accepted friendships
            query = select(Friendship).options(
                selectinload(Friendship.requester),
                selectinload(Friendship.addressee)
            ).where(
                and_(
                    or_(
                        Friendship.requester_id == user_id,
                        Friendship.addressee_id == user_id
                    ),
                    Friendship.status == "accepted"
                )
            )
            
            result = await db.execute(query)
            friendships = result.scalars().all()
            
            friends = []
            for friendship in friendships:
                friend_user = friendship.addressee if friendship.requester_id == user_id else friendship.requester
                profile = await SocialService.get_user_public_profile(db, friend_user.id)
                if profile:
                    friends.append(profile)
            
            return friends
            
        except Exception as e:
            logger.error(f"Error getting friends list: {e}")
            return []


# Singleton instance
social_service = SocialService()
