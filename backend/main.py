"""
TradePulse FastAPI Backend
Main application entry point with live data updates.
"""
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.config import settings
# Import production config if in production
try:
    if not settings.DEBUG:
        from app.config_production import ProductionSettings
        settings = ProductionSettings()
except ImportError:
    pass  # Use regular settings if production config not available
from app.database import init_db
from app.auth.routes import router as auth_router
from app.stocks.routes import router as stocks_router
from app.trading.routes import router as trading_router
from app.dashboard.routes import router as dashboard_router
from app.social.routes import router as social_router
from app.social.competition_trading_routes import router as competition_trading_router
from app.social.competition_scheduler import competition_scheduler
from app.stocks.live_scheduler import live_scheduler
from app.portfolio.routes import router as portfolio_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()
    
    # Start ROBUST live data scheduler in background
    await live_scheduler.start_background_task()
    print("🚀 ROBUST Live data scheduler started - fetching REAL prices every 15 seconds")
    
    # Start competition scheduler
    await competition_scheduler.start_scheduler()
    print("🏆 Competition scheduler started - managing competition lifecycle")
    
    yield
    
    # Shutdown
    live_scheduler.stop_live_updates()
    await competition_scheduler.stop_scheduler()
    print("⏹️  All schedulers stopped")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)


# Set CORS to only allow the deployed frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tradepulse-1.onrender.com",  # Deployed frontend
        "http://localhost:5173",             # Local frontend
        "http://127.0.0.1:5173",             # Localhost (alternative)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(stocks_router)
app.include_router(trading_router)
app.include_router(dashboard_router)
app.include_router(portfolio_router)
app.include_router(social_router)
app.include_router(competition_trading_router)




@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "message": "Welcome to TradePulse API!",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "environment": getattr(settings, 'ENVIRONMENT', 'development')
    }


@app.get("/live-data/test")
async def test_live_data():
    """Test endpoint to check live data functionality."""
    from app.stocks.scheduler import live_scheduler
    
    # Get some cached prices
    cached_prices = live_scheduler.get_all_cached_prices()
    
    return {
        "message": "Live data system status",
        "is_running": live_scheduler.is_running,
        "cached_prices_count": len(cached_prices),
        "sample_prices": dict(list(cached_prices.items())[:5]),  # Show first 5
        "last_update": str(live_scheduler.last_update) if live_scheduler.last_update else None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
