"""
Production configuration for TradePulse deployment.
"""
import os
from .config import Settings


class ProductionSettings(Settings):
    """Production-specific settings."""
    
    # Production Database (PostgreSQL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://user:password@host:5432/tradepulse_prod"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "generate-a-secure-secret-key-in-production")
    DEBUG: bool = False
    
    # API Keys (Required in production)
    ALPHA_VANTAGE_API_KEY: str = os.getenv("ALPHA_VANTAGE_API_KEY")  # No default, must be set
    
    # CORS - Production domains
    ALLOWED_ORIGINS: list[str] = [
        "https://tradepulse.vercel.app",  # Frontend domain
        "https://your-domain.com",       # Custom domain
        "https://tradepulse-frontend.railway.app",  # Railway frontend
    ]
    
    # Database Pool Settings for Production
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_TIMEOUT: int = 30
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100  # API calls per minute per user
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Redis for caching (optional but recommended)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Email settings (for notifications)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")


# Environment-specific settings
def get_settings():
    """Get settings based on environment."""
    environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "production":
        return ProductionSettings()
    else:
        return Settings()


# Use this in main.py
settings = get_settings()
