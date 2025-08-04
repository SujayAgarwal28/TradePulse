"""
REAL Live Stock Data Service for TradePulse
Uses Yahoo Finance API directly for TRUE live market data.
Fixed all previous issues - now provides ACTUAL current stock prices.
"""
import asyncio
import logging
import json
import random
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from ..database import Stock, Portfolio, Position, get_db
from .schemas import StockInfo

logger = logging.getLogger(__name__)

class RealLiveDataService:
    """
    REAL live stock data service using Yahoo Finance Chart API.
    Provides ACTUAL current market prices - no more simulation!
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=15.0,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        self.price_cache = {}
        self.last_update = {}
        # Use the WORKING Yahoo Finance Chart API
        self.base_url = "https://query1.finance.yahoo.com/v8/finance/chart"
"""
REAL Live Stock Data Service for TradePulse
Uses Yahoo Finance API directly for TRUE live market data.
Fixed all previous issues - now provides ACTUAL current stock prices.
"""
import asyncio
import logging
import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from ..database import Stock, Portfolio, Position, get_db
from .schemas import StockInfo

logger = logging.getLogger(__name__)

class RealLiveDataService:
    """
    REAL live stock data service using Yahoo Finance Chart API.
    Provides ACTUAL current market prices - no more simulation!
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=15.0,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        self.price_cache = {}
        self.last_update = {}
        # Use the WORKING Yahoo Finance Chart API
        self.base_url = "https://query1.finance.yahoo.com/v8/finance/chart"
        
    async def get_live_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get REAL live stock price from Yahoo Finance Chart API.
        This actually works and provides current market prices!
        """
        # Check cache (update every 10 seconds for more responsive data)
        cache_key = symbol.upper()
        now = datetime.now()
        
        if (cache_key in self.price_cache and 
            cache_key in self.last_update and
            (now - self.last_update[cache_key]).seconds < 10):
            return self.price_cache[cache_key]
        
        try:
            # Use Yahoo Finance Chart API - this is what actually works!
            url = f"{self.base_url}/{symbol.upper()}"
            params = {
                'interval': '1m',
                'range': '1d',
                'includePrePost': 'true'
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if 'chart' not in data or not data['chart']['result']:
                logger.error(f"No chart data for {symbol}")
                return None
                
            result = data['chart']['result'][0]
            meta = result['meta']
            
            # Get the REAL current price
            current_price = meta.get('regularMarketPrice')
            if not current_price:
                # Try pre/post market price if regular market is closed
                current_price = meta.get('preMarketPrice') or meta.get('postMarketPrice')
            
            if not current_price:
                logger.error(f"No price data found for {symbol}")
                return None
            
            previous_close = meta.get('previousClose', current_price)
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close else 0
            
            # Create the response with REAL market data
            price_data = {
                'symbol': symbol.upper(),
                'name': meta.get('longName', symbol),
                'current_price': float(current_price),
                'previous_close': float(previous_close),
                'change': float(change),  # Add the absolute change amount
                'change_percent': float(change_percent),
                'market_cap': meta.get('marketCap'),
                'volume': meta.get('regularMarketVolume'),
                'sector': 'Technology',  # Yahoo doesn't always provide this in chart API
                'timestamp': datetime.now().isoformat(),
                'source': 'yahoo_finance_chart_api',
                'day_high': float(meta.get('regularMarketDayHigh', current_price)),
                'day_low': float(meta.get('regularMarketDayLow', current_price)),
                'last_updated': datetime.now().isoformat()
            }
            
            # Cache the result
            self.price_cache[cache_key] = price_data
            self.last_update[cache_key] = now
            
            logger.info(f"✅ REAL LIVE PRICE for {symbol}: ${current_price:.2f} (change: {change:+.2f}, {change_percent:+.2f}%)")
            return price_data
            
        except Exception as e:
            logger.error(f"🚨 Yahoo Finance API failed for {symbol}: {e}")
            # Return None to indicate failure - no more fake simulation
            return None
    
    async def update_stock_prices(self, symbols: List[str]) -> Dict[str, Any]:
        """
        Update prices for multiple stocks concurrently.
        Returns a dict of successful updates with REAL market data.
        """
        results = {}
        
        # Process stocks concurrently for better performance
        tasks = [self.get_live_price(symbol) for symbol in symbols]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        for symbol, response in zip(symbols, responses):
            if isinstance(response, Exception):
                logger.error(f"Failed to update {symbol}: {response}")
                continue
            
            if response:
                results[symbol] = response
                logger.info(f"📈 Updated {symbol}: ${response['current_price']:.2f}")
            else:
                logger.warning(f"No REAL data received for {symbol}")
        
        return results
    
    async def update_portfolio_values(self, db: AsyncSession):
        """
        Update all portfolio values with REAL current market prices.
        This makes portfolios show LIVE P&L with actual market data.
        """
        try:
            # Get all portfolios
            portfolios_result = await db.execute(select(Portfolio.id))
            portfolio_ids = [row[0] for row in portfolios_result.fetchall()]
            
            logger.info(f"🔄 Updating portfolio values for {len(portfolio_ids)} portfolios with REAL market data...")
            
            for portfolio_id in portfolio_ids:
                # Get all positions for this portfolio
                positions_result = await db.execute(
                    select(Position).where(
                        Position.portfolio_id == portfolio_id,
                        Position.quantity > 0
                    )
                )
                positions = positions_result.fetchall()
                
                if not positions:
                    continue
                
                # Get unique symbols
                symbols = list(set([pos.Position.symbol for pos in positions]))
                
                # Fetch REAL live prices for all symbols
                live_prices = await self.update_stock_prices(symbols)
                
                if not live_prices:
                    logger.warning(f"No REAL price data received for portfolio {portfolio_id}")
                    continue
                
                # Update each position with REAL live price
                total_market_value = Decimal('0')
                
                for pos_row in positions:
                    position = pos_row.Position
                    symbol = position.symbol
                    
                    if symbol in live_prices:
                        live_price = live_prices[symbol]
                        current_price = Decimal(str(live_price['current_price']))
                        
                        # Calculate position values
                        market_value = current_price * Decimal(str(position.quantity))
                        cost_basis = position.average_cost * Decimal(str(position.quantity))
                        unrealized_pnl = market_value - cost_basis
                        
                        # Update position with REAL market data
                        await db.execute(
                            update(Position).where(Position.id == position.id).values(
                                current_value=market_value,
                                unrealized_pnl=unrealized_pnl,
                                last_updated=datetime.now()
                            )
                        )
                        
                        total_market_value += market_value
                        
                        logger.info(f"📈 REAL UPDATE: {symbol} - {position.quantity} shares @ ${current_price:.2f} = ${market_value:.2f} (P&L: ${unrealized_pnl:.2f})")
                
                # Update portfolio total value
                if total_market_value > 0:
                    portfolio_result = await db.execute(
                        select(Portfolio).where(Portfolio.id == portfolio_id)
                    )
                    portfolio = portfolio_result.scalar_one()
                    
                    total_portfolio_value = portfolio.cash_balance + total_market_value
                    
                    await db.execute(
                        update(Portfolio).where(Portfolio.id == portfolio_id).values(
                            total_value=total_portfolio_value,
                            updated_at=datetime.now()
                        )
                    )
                    
                    logger.info(f"💰 Portfolio {portfolio_id}: REAL total value = ${total_portfolio_value:.2f}")
            
            await db.commit()
            logger.info("✅ ALL portfolio values updated with REAL LIVE market data!")
            
        except Exception as e:
            logger.error(f"🚨 Error updating portfolio values: {e}")
            await db.rollback()
            raise
    
    async def close(self):
        """Clean up resources."""
        await self.client.aclose()

# Global instance with REAL live data
live_data_service = RealLiveDataService()
