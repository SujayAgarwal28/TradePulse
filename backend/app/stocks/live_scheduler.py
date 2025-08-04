"""
ROBUST Live Data Scheduler for TradePulse
Fetches REAL live stock prices every 15 seconds for TRUE market data.
"""
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

from ..database import get_db
from .live_data_service import live_data_service

logger = logging.getLogger(__name__)

class RobustLiveScheduler:
    """Scheduler for updating live stock data every 15 seconds with REAL market prices."""
    
    def __init__(self):
        self.is_running = False
        self.task = None
        self.update_interval = 15  # seconds
        
    async def fetch_and_update_live_data(self):
        """
        Core function that fetches LIVE market data and updates portfolios.
        This is what makes your trading platform show REAL stock prices!
        """
        try:
            logger.info("🔄 Starting live market data update...")
            
            # Get database session
            async for db in get_db():
                try:
                    # Update all portfolio values with live market prices
                    await live_data_service.update_portfolio_values(db)
                    logger.info("✅ Live market data update completed successfully!")
                    break  # Exit the async generator
                except Exception as e:
                    logger.error(f"🚨 Error in live data update: {e}")
                    await db.rollback()
                    raise
                finally:
                    await db.close()
                    
        except Exception as e:
            logger.error(f"🚨 Critical error in live data scheduler: {e}")
    
    async def start_live_updates(self):
        """
        Start the continuous live data updates.
        This runs every 15 seconds to keep your platform truly LIVE!
        """
        if self.is_running:
            logger.warning("⚠️ Live data scheduler already running!")
            return
        
        self.is_running = True
        logger.info(f"🚀 Starting LIVE market data updates every {self.update_interval} seconds...")
        
        try:
            while self.is_running:
                await self.fetch_and_update_live_data()
                await asyncio.sleep(self.update_interval)
        except asyncio.CancelledError:
            logger.info("⏹️ Live data scheduler cancelled")
        except Exception as e:
            logger.error(f"🚨 Live data scheduler crashed: {e}")
        finally:
            self.is_running = False
    
    def stop_live_updates(self):
        """Stop the live data updates."""
        if self.task and not self.task.done():
            self.task.cancel()
        self.is_running = False
        logger.info("⏹️ Live data scheduler stopped")
    
    async def start_background_task(self):
        """Start the live updates as a background task."""
        if self.task and not self.task.done():
            logger.warning("⚠️ Background task already running!")
            return
        
        self.task = asyncio.create_task(self.start_live_updates())
        return self.task

# Global scheduler instance
live_scheduler = RobustLiveScheduler()
