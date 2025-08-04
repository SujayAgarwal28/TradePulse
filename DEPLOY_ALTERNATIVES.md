# 🚀 TradePulse Vercel Deployment Guide

## Quick Deploy to Vercel + Railway

### Option 1: Vercel Frontend + Railway Backend

1. **Deploy Backend to Railway:**
   - Go to [Railway](https://railway.app)
   - Connect GitHub repo
   - Select `backend` folder
   - Add PostgreSQL database
   - Set environment variables
   - Deploy automatically

2. **Deploy Frontend to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repo
   - Set root directory to `frontend`
   - Add environment variable: `VITE_API_BASE_URL = https://your-railway-backend.up.railway.app`
   - Deploy

### Option 2: Full Stack on Railway

1. **Create Railway Project:**
   - Go to [Railway](https://railway.app)
   - "New Project" → "Deploy from GitHub repo"
   - Select your TradePulse repository

2. **Add Services:**
   - Add PostgreSQL database
   - Add service from repo root (for backend)
   - Add another service from repo root (for frontend)

3. **Configure Backend Service:**
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Configure Frontend Service:**
   - Root directory: `frontend`  
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`

### Option 3: Netlify + Supabase

1. **Backend on Supabase:**
   - Create Supabase project
   - Use Edge Functions for API
   - PostgreSQL database included

2. **Frontend on Netlify:**
   - Connect GitHub repo
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`

## Environment Variables

### Backend (.env):
```
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your-super-secret-key
DEBUG=false
ALPHA_VANTAGE_API_KEY=your-api-key
```

### Frontend:
```
VITE_API_BASE_URL=https://your-backend-url.com
```
