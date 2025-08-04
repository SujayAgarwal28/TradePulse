"""
Background task scheduler for fetching live stock data every 15 seconds.
"""
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

from ..database import get_db
from .live_service import live_stock_service

logger = logging.getLogger(__name__)

class LiveDataScheduler:
    """Scheduler for updating live stock data every 15 seconds."""
    
    def __init__(self):
        self.is_running = False
        self.live_cache = {}
        self.last_update = None
        
    async def fetch_and_update_live_data(self):
        """Fetch live data for all relevant stocks and update portfolios."""
        try:
            # Get dashboard stocks (always fetch these)
            dashboard_stocks = await live_stock_service.get_dashboard_stocks()
            
            # Get all portfolio stocks from database
            portfolio_stocks = set()
            async for db in get_db():
                try:
                    # Get all unique portfolio IDs
                    from sqlalchemy import select, text
                    from ..database import Portfolio, Position
                    
                    # Get all active portfolios
                    result = await db.execute(select(Portfolio.id))
                    portfolio_ids = [row[0] for row in result.fetchall()]
                    
                    # Get stocks for each portfolio
                    for portfolio_id in portfolio_ids:
                        stocks = await live_stock_service.get_portfolio_stocks(db, portfolio_id)
                        portfolio_stocks.update(stocks)
                    
                except Exception as e:
                    logger.error(f"Error getting portfolio stocks: {e}")
                break
            
            # Combine all stocks we need to fetch
            all_stocks = list(set(dashboard_stocks + list(portfolio_stocks)))
            logger.info(f"Fetching live data for {len(all_stocks)} stocks: {all_stocks}")
            
            # Fetch live prices
            live_prices = await live_stock_service.fetch_multiple_stocks(all_stocks)
            
            if live_prices:
                # Update cache
                self.live_cache.update(live_prices)
                self.last_update = datetime.utcnow()
                
                # Update all portfolios with new prices
                async for db in get_db():
                    try:
                        # Get all portfolio IDs again
                        result = await db.execute(select(Portfolio.id))
                        portfolio_ids = [row[0] for row in result.fetchall()]
                        
                        # Update each portfolio
                        for portfolio_id in portfolio_ids:
                            await live_stock_service.update_portfolio_values(
                                db, portfolio_id, live_prices
                            )
                        
                        logger.info(f"Updated {len(portfolio_ids)} portfolios with live prices")
                        
                    except Exception as e:
                        logger.error(f"Error updating portfolios: {e}")
                    break
                
                logger.info(f"Live data update completed. Fetched {len(live_prices)} stocks.")
            else:
                logger.warning("No live prices fetched")
                
        except Exception as e:
            logger.error(f"Error in live data update: {e}")
    
    async def start_live_updates(self):
        """Start the background task for live data updates."""
        if self.is_running:
            logger.warning("Live data scheduler is already running")
            return
            
        self.is_running = True
        logger.info("Starting live data scheduler (15-second intervals)")
        
        while self.is_running:
            try:
                await self.fetch_and_update_live_data()
                await asyncio.sleep(15)  # Wait 15 seconds
            except Exception as e:
                logger.error(f"Error in live data scheduler: {e}")
                await asyncio.sleep(15)  # Continue even if there's an error
    
    def stop_live_updates(self):
        """Stop the background task."""
        self.is_running = False
        logger.info("Stopped live data scheduler")
    
    def get_cached_price(self, symbol: str) -> Dict[str, Any]:
        """Get cached live price for a symbol."""
        return self.live_cache.get(symbol.upper(), {})
    
    def get_all_cached_prices(self) -> Dict[str, Dict[str, Any]]:
        """Get all cached prices."""
        return self.live_cache.copy()


# Global scheduler instance
live_scheduler = LiveDataScheduler()
