"""
Configuration settings for TradePulse backend.
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./tradepulse.db"
    )
    
    # Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API Settings
    PROJECT_NAME: str = "TradePulse API"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Alpha Vantage API (Free tier: 25 requests/day, 5 requests/minute)
    ALPHA_VANTAGE_API_KEY: str = os.getenv("ALPHA_VANTAGE_API_KEY", "IIKESCGRVVVG7T3B")  # Get free key from: https://www.alphavantage.co/support/#api-key
    
    # CORS - Allow all origins in development for seamless testing
    ALLOWED_ORIGINS: list[str] = ["*"] if os.getenv("DEBUG", "true").lower() == "true" else [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
