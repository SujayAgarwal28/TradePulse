# 🚀 TradePulse Render Deployment Guide

This guide will help you deploy TradePulse on Render.com using their Blueprint feature.

## 📋 Prerequisites

1. **GitHub Repository**: Your code must be pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **API Keys**: Get your own Alpha Vantage API key (optional but recommended)

## 🎯 Quick Deploy Options

### Option 1: Blueprint Deployment (Recommended)

1. **Connect GitHub to Render**
   - Login to [Render Dashboard](https://dashboard.render.com)
   - Connect your GitHub account
   - Select your TradePulse repository

2. **Deploy with Blueprint**
   - Click "New" → "Blueprint"
   - Select your repository
   - Render will automatically detect the `render.yaml` file
   - Review the services that will be created:
     - PostgreSQL Database (Free tier)
     - Backend API (Python/FastAPI)
     - Frontend Web App (Node.js/React)

3. **Configure Environment Variables (Optional)**
   - The `render.yaml` includes default environment variables
   - Optionally set your own `ALPHA_VANTAGE_API_KEY` (get free key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key))
   - `SECRET_KEY` will be auto-generated
   - `DATABASE_URL` will be auto-configured

4. **Deploy**
   - Click "Apply" to start deployment
   - Wait 10-15 minutes for all services to be ready
   - Services will be available at:
     - Frontend: `https://tradepulse-frontend.onrender.com`
     - Backend: `https://tradepulse-backend.onrender.com`

### Option 2: Manual Service Creation

If you prefer manual setup:

1. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Database Name: `tradepulse-postgres`
   - Plan: Free

2. **Create Backend Service**
   - New → Web Service
   - Connect your GitHub repo
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     ```
     DATABASE_URL: (from PostgreSQL service)
     SECRET_KEY: (generate a secure key)
     DEBUG: false
     ALPHA_VANTAGE_API_KEY: your_api_key_here
     ```

3. **Create Frontend Service**
   - New → Web Service
   - Connect your GitHub repo
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment Variables:
     ```
     VITE_API_BASE_URL: https://your-backend-service.onrender.com
     ```

## 🔧 Post-Deployment Setup

1. **Initialize Database**
   - The database will be automatically initialized on first run
   - Check backend logs to confirm successful startup

2. **Test the Application**
   - Frontend URL: `https://your-frontend-service.onrender.com`
   - Backend API: `https://your-backend-service.onrender.com`
   - API Docs: `https://your-backend-service.onrender.com/docs`

3. **Create First User**
   - Visit the frontend URL
   - Click "Sign Up" to create your first account
   - Start trading with $100,000 virtual money!

## 📊 Service URLs

After deployment, you'll have:

- **Frontend**: `https://tradepulse-frontend.onrender.com`
- **Backend API**: `https://tradepulse-backend.onrender.com`
- **Database**: Internal PostgreSQL (managed by Render)

## 🎯 Key Features Available

✅ **Live Stock Data** - Real-time price updates every 15 seconds  
✅ **Portfolio Management** - Track your virtual investments  
✅ **Indian Index Trading** - Nifty 50, Sensex, and more  
✅ **Competition System** - Compete with other traders  
✅ **Social Features** - User search and leaderboards  
✅ **Responsive Design** - Works on desktop and mobile  

## 🛠️ Troubleshooting

### Common Issues

1. **Backend Won't Start**
   - Check environment variables are set correctly
   - Verify DATABASE_URL is connected
   - Check logs: Render Dashboard → Backend Service → Logs

2. **Frontend Can't Connect to Backend**
   - Verify VITE_API_BASE_URL points to correct backend URL
   - Check CORS settings in backend
   - Ensure both services are running

3. **Database Connection Issues**
   - Wait for PostgreSQL service to be fully ready
   - Check DATABASE_URL format: `postgresql+asyncpg://...`
   - Verify database service is healthy

### Performance Notes

- **Free Tier Limitations**: Services may sleep after 15 minutes of inactivity
- **Cold Starts**: First request may take 30-60 seconds after sleep
- **Database**: Free PostgreSQL has 1GB storage limit

## 🔄 Continuous Deployment

Once deployed, Render will automatically redeploy when you push to your main branch:

1. Make changes to your code
2. Commit and push to GitHub
3. Render automatically rebuilds and deploys
4. Zero-downtime deployment (except during major changes)

## 🎉 Success!

Your TradePulse application is now live and accessible worldwide! 

Start trading with virtual money and invite others to compete in trading competitions.

---

**Need Help?** Check the [Render Documentation](https://render.com/docs) or create an issue in the repository.
