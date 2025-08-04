"""
Competition services for TradePulse trading contests.
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import and_, or_, func, desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import (
    User, UserStats, Competition, CompetitionParticipant, 
    CompetitionTrade, Portfolio
)
from .schemas import CompetitionCreate, CompetitionResponse, CompetitionLeaderboard

logger = logging.getLogger(__name__)


class CompetitionService:
    """Service for managing trading competitions."""
    
    @staticmethod
    async def create_competition(
        db: AsyncSession, 
        creator_id: int, 
        competition_data: CompetitionCreate
    ) -> Optional[int]:
        """Create a new trading competition."""
        try:
            start_date = datetime.utcnow()  # Start immediately for testing
            end_date = start_date + timedelta(hours=competition_data.duration_hours)
            
            competition = Competition(
                name=competition_data.name,
                description=competition_data.description,
                creator_id=creator_id,
                starting_balance=competition_data.starting_balance,
                start_date=start_date,
                end_date=end_date,
                max_participants=competition_data.max_participants,
                is_public=competition_data.is_public,
                status="active"  # Start active immediately for testing
            )
            
            db.add(competition)
            await db.commit()
            await db.refresh(competition)
            
            # Auto-join creator
            join_result = await CompetitionService.join_competition(db, competition.id, creator_id)
            if not join_result["success"]:
                logger.error(f"Failed to auto-join creator to competition: {join_result.get('error')}")
                # Don't fail competition creation if auto-join fails
            
            logger.info(f"Competition created: {competition.name} (ID: {competition.id})")
            return competition.id
            
        except Exception as e:
            logger.error(f"Error creating competition: {e}")
            await db.rollback()
            return None
    
    @staticmethod
    async def get_active_competitions(db: AsyncSession, limit: int = 20) -> List[dict]:
        """Get list of active/upcoming public competitions."""
        try:
            query = select(Competition).options(
                selectinload(Competition.creator),
                selectinload(Competition.participants)
            ).where(
                and_(
                    Competition.is_public == True,
                    Competition.status.in_(["upcoming", "active"])
                )
            ).order_by(desc(Competition.created_at)).limit(limit)
            
            result = await db.execute(query)
            competitions = result.scalars().all()
            
            competitions_list = []
            for comp in competitions:
                competitions_list.append({
                    "id": comp.id,
                    "name": comp.name,
                    "description": comp.description,
                    "creator": {
                        "id": comp.creator.id,
                        "username": comp.creator.username or f"trader_{comp.creator.id}",
                        "full_name": comp.creator.full_name
                    },
                    "starting_balance": float(comp.starting_balance),
                    "start_date": comp.start_date,
                    "end_date": comp.end_date,
                    "status": comp.status,
                    "max_participants": comp.max_participants,
                    "current_participants": len(comp.participants),
                    "is_public": comp.is_public,
                    "created_at": comp.created_at
                })
            
            return competitions_list
            
        except Exception as e:
            logger.error(f"Error getting active competitions: {e}")
            return []
    
    @staticmethod
    async def join_competition(db: AsyncSession, competition_id: int, user_id: int) -> dict:
        """Join a trading competition."""
        try:
            logger.info(f"Attempting to join competition {competition_id} for user {user_id}")
            
            # Check if competition exists and is joinable
            comp_query = select(Competition).where(Competition.id == competition_id)
            comp_result = await db.execute(comp_query)
            competition = comp_result.scalar_one_or_none()
            
            if not competition:
                logger.error(f"Competition {competition_id} not found")
                return {"success": False, "error": "Competition not found"}
                
            if competition.status not in ["upcoming", "active"]:
                logger.error(f"Competition {competition_id} status is {competition.status}, not joinable")
                return {"success": False, "error": f"Competition is {competition.status} and not joinable"}

            # Check if user already joined
            participant_query = select(CompetitionParticipant).where(
                and_(
                    CompetitionParticipant.competition_id == competition_id,
                    CompetitionParticipant.user_id == user_id
                )
            )

            participant_result = await db.execute(participant_query)
            existing_participant = participant_result.scalar_one_or_none()

            if existing_participant:
                logger.info(f"User {user_id} already joined competition {competition_id}")
                return {"success": True, "already_joined": True, "message": "Already participating in this competition"}

            # Check participant limit
            participant_count_query = select(func.count(CompetitionParticipant.id)).where(
                CompetitionParticipant.competition_id == competition_id
            )
            count_result = await db.execute(participant_count_query)
            current_count = count_result.scalar()

            if current_count >= competition.max_participants:
                logger.error(f"Competition {competition_id} is full ({current_count}/{competition.max_participants})")
                return {"success": False, "error": f"Competition is full ({current_count}/{competition.max_participants})"}

            # Create participant
            participant = CompetitionParticipant(
                competition_id=competition_id,
                user_id=user_id,
                starting_balance=competition.starting_balance,
                current_balance=competition.starting_balance
            )

            db.add(participant)
            await db.commit()

            # Skip user stats update for now - may not be needed
            # await CompetitionService._update_user_competition_stats(db, user_id, "joined")

            logger.info(f"User {user_id} successfully joined competition {competition_id}")
            return {"success": True, "newly_joined": True, "message": "Successfully joined competition"}
            
        except Exception as e:
            logger.error(f"Error joining competition: {e}")
            await db.rollback()
            return {"success": False, "error": f"Database error: {str(e)}"}
    
    @staticmethod
    async def get_competition_leaderboard(
        db: AsyncSession, 
        competition_id: int
    ) -> Optional[dict]:
        """Get competition leaderboard with rankings."""
        try:
            # Get competition details
            comp_query = select(Competition).options(
                selectinload(Competition.creator)
            ).where(Competition.id == competition_id)
            comp_result = await db.execute(comp_query)
            competition = comp_result.scalar_one_or_none()
            
            if not competition:
                return None
            
            # Get participants with rankings
            participants_query = select(CompetitionParticipant).options(
                selectinload(CompetitionParticipant.user)
            ).where(
                CompetitionParticipant.competition_id == competition_id
            ).order_by(desc(CompetitionParticipant.current_balance))
            
            participants_result = await db.execute(participants_query)
            participants = participants_result.scalars().all()
            
            # Calculate rankings and return percentages
            leaderboard_data = []
            for rank, participant in enumerate(participants, 1):
                return_amount = participant.current_balance - participant.starting_balance
                return_percentage = (return_amount / participant.starting_balance) * 100
                
                leaderboard_data.append({
                    "rank": rank,
                    "user": {
                        "id": participant.user.id,
                        "username": participant.user.username or f"trader_{participant.user.id}",
                        "full_name": participant.user.full_name,
                        "profile_picture_url": participant.user.profile_picture_url
                    },
                    "starting_balance": float(participant.starting_balance),
                    "current_balance": float(participant.current_balance),
                    "total_return": float(return_amount),
                    "return_percentage": round(return_percentage, 2),
                    "trades_count": participant.trades_count,
                    "status": participant.status,
                    "joined_at": participant.joined_at
                })
            
            return {
                "competition": {
                    "id": competition.id,
                    "name": competition.name,
                    "description": competition.description,
                    "creator": {
                        "id": competition.creator.id,
                        "username": competition.creator.username or f"trader_{competition.creator.id}",
                        "full_name": competition.creator.full_name
                    },
                    "starting_balance": float(competition.starting_balance),
                    "start_date": competition.start_date,
                    "end_date": competition.end_date,
                    "status": competition.status,
                    "max_participants": competition.max_participants,
                    "current_participants": len(participants)
                },
                "participants": leaderboard_data
            }
            
        except Exception as e:
            logger.error(f"Error getting competition leaderboard: {e}")
            return None
    
    @staticmethod
    async def get_user_competitions(db: AsyncSession, user_id: int) -> List[dict]:
        """Get competitions that user has joined."""
        try:
            query = select(CompetitionParticipant).options(
                selectinload(CompetitionParticipant.competition).selectinload(Competition.creator)
            ).where(CompetitionParticipant.user_id == user_id).order_by(
                desc(CompetitionParticipant.joined_at)
            )
            
            result = await db.execute(query)
            participants = result.scalars().all()
            
            competitions_list = []
            for participant in participants:
                comp = participant.competition
                return_amount = participant.current_balance - participant.starting_balance
                return_percentage = (return_amount / participant.starting_balance) * 100
                
                competitions_list.append({
                    "id": comp.id,
                    "name": comp.name,
                    "status": comp.status,
                    "start_date": comp.start_date,
                    "end_date": comp.end_date,
                    "starting_balance": float(participant.starting_balance),
                    "current_balance": float(participant.current_balance),
                    "total_return": float(return_amount),
                    "return_percentage": round(return_percentage, 2),
                    "rank": participant.rank,
                    "trades_count": participant.trades_count,
                    "joined_at": participant.joined_at
                })
            
            return competitions_list
            
        except Exception as e:
            logger.error(f"Error getting user competitions: {e}")
            return []
    
    @staticmethod
    async def _update_user_competition_stats(db: AsyncSession, user_id: int, action: str):
        """Update user's competition statistics."""
        try:
            # Get or create user stats
            stats_query = select(UserStats).where(UserStats.user_id == user_id)
            stats_result = await db.execute(stats_query)
            user_stats = stats_result.scalar_one_or_none()
            
            if not user_stats:
                user_stats = UserStats(user_id=user_id)
                db.add(user_stats)
                await db.flush()
            
            if action == "joined":
                user_stats.competition_participations += 1
            elif action == "won":
                user_stats.competition_wins += 1
                user_stats.rank_points += 50  # Bonus points for winning
            
            await db.commit()
            
        except Exception as e:
            logger.error(f"Error updating user competition stats: {e}")


# Singleton instance
competition_service = CompetitionService()
