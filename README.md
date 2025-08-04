# TradePulse 📈

🚀 **A modern, full-stack paper trading platform** with real-time market data, portfolio management, and Indian index trading.

> **📚 For detailed documentation, troubleshooting, and project history, see: [COMPREHENSIVE_PROJECT_DOCUMENTATION.md](./COMPREHENSIVE_PROJECT_DOCUMENTATION.md)**

## ⚡ Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone & Setup
```bash
git clone <repository-url>
cd TradePulse
```

### 2. Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the App
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🎯 Core Features

- 📈 **Live Market Data** (Stocks & Indian Indices)
- 💰 **$100k Virtual Trading Portfolio** 
- 📊 **Real-time Portfolio Analytics**
- 🔐 **Secure JWT Authentication**
- 📱 **Responsive Design with TailwindCSS**
- 🔄 **Live Price Updates** (15-second intervals)
- 🇮🇳 **Indian Index Trading** (Nifty, Sensex)
- 💹 **Realistic Brokerage Calculations** (0.05%)
- 🎯 **Tab-based Trading Interface**

## 📁 Project Structure

```
TradePulse/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── auth/              # JWT authentication
│   │   ├── stocks/            # Yahoo Finance integration  
│   │   ├── trading/           # Trading engine & portfolio
│   │   └── database.py        # SQLAlchemy models
│   └── main.py               # FastAPI application
├── frontend/                  # React TypeScript frontend
│   ├── src/
│   │   ├── pages/            # Login, Portfolio, Trading pages
│   │   ├── services/         # API client
│   │   └── components/       # Reusable UI components
│   └── package.json         
├── COMPREHENSIVE_PROJECT_DOCUMENTATION.md  # 📚 Complete docs
├── PROJECT_REQUIREMENTS.md                 # Original specs
└── README.md                              # This file
```

## 🛠️ Technology Stack

**Backend**: FastAPI + SQLAlchemy + yfinance + JWT
**Frontend**: React + TypeScript + TailwindCSS + Vite
**Database**: SQLite (dev) / PostgreSQL (prod)
**Deployment**: Docker ready for Render/Railway/Replit

## 🚨 Common Issues

**Connection Refused Error?**
```bash
# Ensure backend runs on all interfaces:
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Portfolio Not Loading?**
- Check browser console for errors
- Verify backend is accessible at http://localhost:8000/health
- Clear browser cache and restart frontend

**For detailed troubleshooting, see the comprehensive documentation.**

## 📚 Documentation

- **[COMPREHENSIVE_PROJECT_DOCUMENTATION.md](./COMPREHENSIVE_PROJECT_DOCUMENTATION.md)** - Complete project guide, troubleshooting, and technical details
- **[PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md)** - Original project specifications
- **[LIVE_STOCK_DATA_INTEGRATION.md](./LIVE_STOCK_DATA_INTEGRATION.md)** - Stock data integration details

## 🎉 Status

✅ **PRODUCTION READY** - Fully functional paper trading platform with live data integration.

---

*For complete project history, issue resolutions, API documentation, deployment guides, and technical specifications, please refer to [COMPREHENSIVE_PROJECT_DOCUMENTATION.md](./COMPREHENSIVE_PROJECT_DOCUMENTATION.md)*
- `Ctrl+Shift+P` → "Tasks: Run Task"
- Select "Start Full Stack" to run both backend and frontend

## 🐳 Docker Development

Start the full stack with Docker Compose:
```bash
docker-compose up --build
```

This will start:
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- PostgreSQL database

## 📱 Usage

1. **Registration**: Create an account with email/password
2. **Dashboard**: View portfolio overview and market movers
3. **Trading**: Search for stocks and place buy/sell orders
4. **Portfolio**: Track your positions and performance
5. **History**: Review past trades and analytics

## 🔒 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/tradepulse
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## 🧪 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Stocks
- `GET /stocks/search?q={query}` - Search stocks
- `GET /stocks/{symbol}` - Get stock info
- `GET /stocks/{symbol}/history` - Get price history
- `GET /stocks/market/movers` - Get top gainers/losers

### Trading
- `POST /trading/buy` - Place buy order
- `POST /trading/sell` - Place sell order
- `GET /trading/portfolio` - Get portfolio
- `GET /trading/positions` - Get current positions
- `GET /trading/history` - Get trade history
- `GET /trading/stats` - Get portfolio statistics

### Dashboard
- `GET /dashboard/overview` - Dashboard data
- `GET /dashboard/performance` - Performance charts

## 🎨 UI/UX Features

- **Dark Theme**: Professional financial app aesthetic
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live stock prices and portfolio values
- **Color-coded P&L**: Green for gains, red for losses
- **Interactive Charts**: Portfolio performance visualization
- **Smooth Animations**: Modern transitions and hover effects

## 🔧 Development

### Backend Development
```bash
cd backend
python run_dev.py  # Auto-reload enabled
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot module replacement enabled
```

### Database Migrations
```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```


## 📊 Performance

- **Backend**: FastAPI with async support for high concurrency
- **Frontend**: Vite for fast development and optimized builds
- **Database**: PostgreSQL with connection pooling
- **Caching**: React Query for client-side caching
- **Bundle Size**: Optimized with tree-shaking and code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Yahoo Finance for providing stock data API
- FastAPI for the excellent Python web framework
- React and the entire frontend ecosystem
- TailwindCSS for beautiful styling utilities


---

**Note**: This is a paper trading application for educational purposes only. No real money is involved in any transactions.
