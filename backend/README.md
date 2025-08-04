# TradePulse Backend

This is the FastAPI backend for the TradePulse paper trading platform.

## Features
- User authentication (JWT)
- Stock data fetching
- Paper trading engine
- Dashboard APIs

## Setup
1. Create a virtual environment:
   ```sh
   python -m venv venv
   ```
2. Activate the environment and install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Run the server:
   ```sh
   uvicorn main:app --reload
   ```

## Deployment
- Ready for deployment on Render, Railway, or Replit.
- Dockerfile included for containerization.
