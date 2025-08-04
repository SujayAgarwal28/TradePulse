"""
Competition Scheduler - manages competition status transitions
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..database import AsyncSessionLocal, Competition, CompetitionParticipant

logger = logging.getLogger(__name__)


class CompetitionScheduler:
    """Manages competition status transitions and automated tasks."""
    
    def __init__(self):
        self.is_running = False
        self._task = None
    
    async def start_scheduler(self):
        """Start the competition scheduler."""
        if self.is_running:
            return
        
        self.is_running = True
        self._task = asyncio.create_task(self._scheduler_loop())
        logger.info("🏆 Competition scheduler started")
    
    async def stop_scheduler(self):
        """Stop the competition scheduler."""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("⏹️ Competition scheduler stopped")
    
    async def _scheduler_loop(self):
        """Main scheduler loop."""
        while self.is_running:
            try:
                await self._process_competitions()
                await asyncio.sleep(30)  # Check every 30 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Competition scheduler error: {e}")
                await asyncio.sleep(60)  # Wait longer on error
    
    async def _process_competitions(self):
        """Process all competitions and update statuses."""
        async with AsyncSessionLocal() as db:
            try:
                # Get all non-completed competitions
                result = await db.execute(
                    select(Competition).where(
                        Competition.status.in_(["upcoming", "active"])
                    )
                )
                competitions = result.scalars().all()
                
                now = datetime.utcnow()
                
                for comp in competitions:
                    if comp.status == "upcoming" and comp.start_date <= now:
                        # Start the competition
                        await self._start_competition(db, comp)
                    elif comp.status == "active" and comp.end_date <= now:
                        # End the competition
                        await self._end_competition(db, comp)
                
                await db.commit()
                
            except Exception as e:
                logger.error(f"Error processing competitions: {e}")
                await db.rollback()
    
    async def _start_competition(self, db: AsyncSession, competition: Competition):
        """Start a competition."""
        try:
            competition.status = "active"
            logger.info(f"🚀 Started competition: {competition.name} (ID: {competition.id})")
        except Exception as e:
            logger.error(f"Error starting competition {competition.id}: {e}")
    
    async def _end_competition(self, db: AsyncSession, competition: Competition):
        """End a competition and calculate final rankings."""
        try:
            competition.status = "completed"
            
            # Calculate final rankings
            await self._calculate_final_rankings(db, competition)
            
            logger.info(f"🏁 Ended competition: {competition.name} (ID: {competition.id})")
        except Exception as e:
            logger.error(f"Error ending competition {competition.id}: {e}")
    
    async def _calculate_final_rankings(self, db: AsyncSession, competition: Competition):
        """Calculate final rankings for a completed competition."""
        try:
            # Get all participants
            result = await db.execute(
                select(CompetitionParticipant).where(
                    CompetitionParticipant.competition_id == competition.id
                )
            )
            participants = result.scalars().all()
            
            # Calculate final portfolio values (this would need the portfolio calculation logic)
            # For now, just rank by current_balance as a placeholder
            participants_with_values = []
            for participant in participants:
                # TODO: Add proper portfolio value calculation including stock holdings
                portfolio_value = float(participant.current_balance)
                participants_with_values.append((participant, portfolio_value))
            
            # Sort by portfolio value (descending)
            participants_with_values.sort(key=lambda x: x[1], reverse=True)
            
            # Update rankings
            for rank, (participant, portfolio_value) in enumerate(participants_with_values, 1):
                participant.rank = rank
                participant.total_return = portfolio_value - float(participant.starting_balance)
                participant.return_percentage = (participant.total_return / float(participant.starting_balance)) * 100
                participant.status = "completed"
            
            logger.info(f"📊 Calculated rankings for competition {competition.id}")
            
        except Exception as e:
            logger.error(f"Error calculating rankings for competition {competition.id}: {e}")


# Global scheduler instance
competition_scheduler = CompetitionScheduler()
