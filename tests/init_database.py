#!/usr/bin/env python3
"""
DATABASE INITIALIZATION SCRIPT
==============================
Creates all missing database tables for TradePulse
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.database import engine, Base

async def create_tables():
    """Create all database tables"""
    try:
        print("Creating database tables...")
        
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ All database tables created successfully!")
        
        # Verify tables were created
        from backend.app.database import Competition, CompetitionParticipant
        print(f"✅ Competition table: {Competition.__tablename__}")
        print(f"✅ Participants table: {CompetitionParticipant.__tablename__}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        import traceback
        traceback.print_exc()

async def main():
    print("=" * 50)
    print("  TRADEPULSE DATABASE INITIALIZATION")
    print("=" * 50)
    
    await create_tables()
    
    print("\n🎉 Database initialization complete!")
    print("Now restart the backend and try competition features again.")

if __name__ == "__main__":
    asyncio.run(main())
