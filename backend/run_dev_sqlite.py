#!/usr/bin/env python3
"""
Development server startup script for TradePulse backend (SQLite version).
"""
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    
    # Set environment for SQLite development
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./tradepulse.db"
    os.environ["SECRET_KEY"] = "dev-secret-key-change-in-production"
    os.environ["DEBUG"] = "true"
    
    print("🚀 Starting TradePulse Backend (Development Mode)...")
    print("📍 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("💾 Database: SQLite (tradepulse.db)")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
