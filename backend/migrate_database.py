"""
Database migration script for TradePulse.
Exports data from SQLite and imports to PostgreSQL.
"""
import sqlite3
import asyncio
import asyncpg
from decimal import Decimal
from datetime import datetime

async def migrate_data():
    """Migrate data from SQLite to PostgreSQL."""
    
    # Connect to SQLite (source)
    sqlite_conn = sqlite3.connect('tradepulse.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to PostgreSQL (destination)
    postgres_url = "your_postgresql_url_here"
    postgres_conn = await asyncpg.connect(postgres_url)
    
    try:
        # Migrate users
        sqlite_cursor.execute("SELECT * FROM users")
        users = sqlite_cursor.fetchall()
        
        for user in users:
            await postgres_conn.execute("""
                INSERT INTO users (id, username, email, hashed_password, is_active, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, *user)
        
        # Migrate portfolios
        sqlite_cursor.execute("SELECT * FROM portfolios")
        portfolios = sqlite_cursor.fetchall()
        
        for portfolio in portfolios:
            await postgres_conn.execute("""
                INSERT INTO portfolios (id, user_id, cash_balance, total_portfolio_value, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, *portfolio)
        
        # Migrate holdings
        sqlite_cursor.execute("SELECT * FROM holdings")
        holdings = sqlite_cursor.fetchall()
        
        for holding in holdings:
            await postgres_conn.execute("""
                INSERT INTO holdings (id, portfolio_id, symbol, quantity, average_price, current_price, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, *holding)
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    
    finally:
        sqlite_conn.close()
        await postgres_conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_data())
