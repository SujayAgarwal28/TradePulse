#!/bin/bash
# Build script for Render deployment

echo "🚀 Starting TradePulse backend build..."

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations (if any)
# python -c "from app.database import init_db; init_db()"

echo "✅ Backend build completed!"
