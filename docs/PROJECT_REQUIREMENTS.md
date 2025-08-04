# TradePulse - Project Requirements & Structure

## 🏗️ Project Structure
```
TradePulse/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── config.py          # Settings and configuration
│   │   ├── database.py        # Database connection and models
│   │   ├── auth/              # Authentication module
│   │   │   ├── __init__.py
│   │   │   ├── models.py      # User models
│   │   │   ├── schemas.py     # Pydantic schemas
│   │   │   ├── routes.py      # Auth endpoints
│   │   │   └── utils.py       # JWT, password hashing
│   │   ├── stocks/            # Stock data module
│   │   │   ├── __init__.py
│   │   │   ├── models.py      # Stock models
│   │   │   ├── schemas.py     # Stock schemas
│   │   │   ├── routes.py      # Stock endpoints
│   │   │   └── services.py    # Yahoo Finance integration
│   │   ├── trading/           # Trading engine module
│   │   │   ├── __init__.py
│   │   │   ├── models.py      # Portfolio, Trade models
│   │   │   ├── schemas.py     # Trading schemas
│   │   │   ├── routes.py      # Trading endpoints
│   │   │   └── engine.py      # Trading logic
│   │   └── dashboard/         # Dashboard API module
│   │       ├── __init__.py
│   │       ├── routes.py      # Dashboard endpoints
│   │       └── analytics.py   # P&L calculations
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env
│   └── README.md
├── frontend/                   # React TypeScript frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API calls
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   └── App.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .github/
│   └── copilot-instructions.md
├── PROJECT_OVERVIEW.md
├── PROJECT_REQUIREMENTS.md    # This file
└── README.md
```

## 🎯 Functional Requirements

### 1. Authentication System
- User registration with email/password
- JWT-based login/logout
- Protected routes and middleware
- Password hashing with bcrypt
- Session management

### 2. Stock Data Integration
- Yahoo Finance API integration using `yfinance`
- Real-time stock price fetching
- Support for global stock symbols
- Stock search functionality
- Price history data

### 3. Paper Trading Engine
- Virtual portfolio management
- Buy/sell order execution
- Portfolio balance tracking
- Trade history storage
- P&L calculations
- Position management

### 4. Dashboard & Analytics
- Real-time portfolio performance
- Interactive charts (Chart.js/Plotly)
- Top gainers/losers display
- Market movers analysis
- Trade history with filters
- User statistics (win ratio, total trades, net worth)
- Color-coded gains/losses

### 5. Database Schema
```sql
-- Users table
users (id, email, password_hash, created_at, updated_at)

-- Portfolios table
portfolios (id, user_id, balance, total_value, created_at, updated_at)

-- Stocks table (cache)
stocks (id, symbol, name, current_price, last_updated)

-- Trades table
trades (id, user_id, symbol, type, quantity, price, timestamp)

-- Positions table (current holdings)
positions (id, user_id, symbol, quantity, avg_price, current_value)
```

## 🔧 Technical Requirements

### Backend (FastAPI)
- Python 3.11+
- FastAPI with async/await
- SQLAlchemy ORM with PostgreSQL
- Pydantic for data validation
- JWT authentication
- CORS middleware for frontend
- Background tasks for real-time updates
- Error handling and logging

### Frontend (React + TypeScript)
- React 18+ with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- React Query for API state management
- Chart.js or Recharts for visualizations
- Responsive design (mobile-first)
- Dark theme support

### Database
- PostgreSQL 15+
- Async database connections
- Database migrations
- Connection pooling
- Environment-based configuration

### Deployment
- Docker containerization
- Docker Compose for local development
- Environment variables for configuration
- Ready for Render/Railway/Replit deployment
- Health check endpoints
- Production-ready logging

## 🚀 API Endpoints Structure

### Authentication
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me

### Stocks
- GET /stocks/search?q={symbol}
- GET /stocks/{symbol}
- GET /stocks/{symbol}/history

### Trading
- POST /trading/buy
- POST /trading/sell
- GET /trading/portfolio
- GET /trading/positions
- GET /trading/history

### Dashboard
- GET /dashboard/stats
- GET /dashboard/performance
- GET /dashboard/market-movers

## 🎨 UI/UX Requirements
- Dark theme with financial aesthetics
- Responsive design (mobile/tablet/desktop)
- Loading states and error handling
- Real-time updates
- Smooth animations and transitions
- Accessible color contrast for gains/losses
- Clean, professional layout

## 🔒 Security Requirements
- Password hashing (bcrypt)
- JWT token expiration
- CORS configuration
- Input validation and sanitization
- SQL injection prevention
- Rate limiting on sensitive endpoints
- Secure environment variable handling

## 📊 Performance Requirements
- API response time < 500ms
- Real-time price updates (WebSocket or polling)
- Efficient database queries
- Frontend bundle optimization
- Lazy loading for heavy components
- Caching for frequently accessed data

## 🧪 Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Frontend component testing
- E2E testing for critical user flows
- Database transaction testing
- Error scenario testing
