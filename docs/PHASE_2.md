# TradePulse – Phase 2 Development Plan

## ✅ Current Status
- Frontend UI is functional and clean.
- User authentication and per-user state are implemented.
- Pages: Dashboard, Portfolio, and Trade exist.
- Basic portfolio page with limited data.
- Dashboard is currently hardcoded and overlaps with Portfolio.
- Trading supports individual stocks only (no index or options yet).
- No user profile or settings.
- Portfolio P&L calculations are inaccurate.

---

## 📄 Page Structure & Responsibilities

### 📊 Portfolio Page (User-Centric)
> This page reflects **the user's trading performance**.

**Key Features:**
- Holdings table with symbol, quantity, avg buy price, current price, P&L
- Total portfolio value
- Total invested amount
- Net profit/loss (absolute and %)
- Trade history with filters (symbol/date/order type)
- Allocation pie chart
- Gain/loss visualizations
- Cumulative profit over time
- Personal metrics (optional):
  - Win/Loss ratio
  - Average holding duration

---

### 📈 Dashboard Page (Market-Centric)
> This page provides **market-wide insights and tools**.

**Key Features:**
- Top gainers/losers of the day
- Live indices summary (e.g., NIFTY 50, NASDAQ)
- Watchlist management:
  - Add/remove symbols
  - Show real-time price and % change
- Market news feed (via API like Yahoo Finance or Finnhub)
- Ticker tape banner for major symbols
- Optional: Sector-wise performance summary
- User’s top-performing holding (quick view)

---

### 💼 Trade Page
> A simple, focused space to **search and execute trades**.

**Key Features:**
- Search for stocks, indices, or options
- Buy/Sell interface
- Live symbol info card
- Mini price chart (7-day or 30-day trend)
- Available virtual cash summary
- Validation and confirmation dialogs

---

## 🧠 Phase 2 Goals

### 1. 🔧 Fix Portfolio Calculations
- Calculate accurate:
  - Avg buy price
  - Market value
  - P&L (absolute and %)
- Sync values live using real-time stock prices

---

### 2. 👤 Add User Profile & Settings
- Profile page with:
  - Username, email, profile picture
  - Password reset
  - Option to reset/delete portfolio
- Add to navbar

---

### 3. 🥊 Trading Challenge System (Gamification)
**Core Features:**
- Search users by username/email
- Invite friend to trading challenge:
  - Duration: 2–5 days
  - Virtual capital: custom amount
- Only trades within the challenge are counted
- View ongoing and past challenges
- Automatically compute winner at end
- Display stats in both profiles

**Database Schema Suggestions:**
```sql
challenges (
  id, user1_id, user2_id, start_time, end_time, virtual_capital, status
);

challenge_trades (
  id, challenge_id, user_id, symbol, quantity, type, price, timestamp
);
4. 📶 Add Index and Options Support
Support viewing/trading of major indices:

NIFTY 50, NASDAQ, S&P 500

Add basic options trading simulation:

Limited to calls/puts for major stocks

Track symbol, type, strike price, expiry

Visual indicator for options

