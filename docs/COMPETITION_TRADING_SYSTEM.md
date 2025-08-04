# Competition Trading System - How It Works

## Overview
The TradePulse platform now has **TWO SEPARATE TRADING SYSTEMS**:

### 1. Personal Trading (Your Main Portfolio)
- **Access**: `/trading` page
- **Portfolio**: Your personal account with ₹1,00,000 (or whatever balance you have)
- **Stocks**: Buy/sell affects your personal holdings
- **Purpose**: Long-term investing and practice

### 2. Competition Trading (Competition-Specific Portfolio)
- **Access**: `/competitions/{competitionId}/trade` page  
- **Portfolio**: Separate virtual portfolio with competition starting balance (default ₹10,000)
- **Stocks**: Buy/sell affects only your competition holdings
- **Purpose**: Short-term contests and competitions

## How to Use Competition Trading

### Step 1: Join a Competition
1. Go to **Social Hub** (`/social`)
2. Browse active competitions
3. Click **"Join Competition"** on any available competition
4. You get a fresh virtual portfolio with the competition's starting balance

### Step 2: Trade in Competition
1. From competition details page, click **"Trade Now"**
2. You'll be taken to the competition trading interface
3. **Your competition portfolio is completely separate** from your personal portfolio
4. Buy/sell stocks using the competition's virtual money

### Step 3: Track Performance
- Competition leaderboard shows real-time rankings
- Your competition portfolio value determines your rank
- Winner = highest portfolio value at competition end

## Key Features

### Portfolio Isolation
- **Personal Portfolio**: ₹1,00,000 (your real practice money)
- **Competition Portfolio**: ₹10,000 (fresh start for each competition)
- **No Cross-Contamination**: Trades in one don't affect the other

### Trading Interface Differences
- **Personal Trading**: Blue theme, shows your main balance
- **Competition Trading**: Purple theme, shows competition balance
- **Clear Mode Indicators**: Banners show which mode you're in

### Real-Time Competition Updates
- Live leaderboards with profit/loss tracking
- Real-time portfolio value calculations
- Automatic ranking updates

## User Flow Example

1. **Personal Trading**: User has ₹95,000 in personal account
2. **Join Competition**: Gets ₹10,000 fresh competition portfolio
3. **Competition Trading**: Buys ₹8,000 worth of stocks in competition
4. **Separate Tracking**: 
   - Personal: ₹95,000 + personal holdings
   - Competition: ₹2,000 cash + ₹8,000 stocks = ₹10,000 total
5. **Competition Ends**: Competition portfolio calculated for ranking
6. **Personal Continues**: Personal portfolio unaffected

## Technical Implementation

### Backend Separation
- Personal trades → `trading/` endpoints → `user_holdings` table
- Competition trades → `trading/competitions/` endpoints → `competition_trades` table
- Separate cash tracking in `competition_participants` table

### Frontend Separation  
- Personal trading: `TradingFixed` component
- Competition trading: `CompetitionTrading` component
- Mode switching: Clear navigation between trading types

### Database Structure
```sql
-- Personal trading
user_holdings (user_id, symbol, quantity)
trades (user_id, symbol, quantity, price)

-- Competition trading
competition_participants (user_id, competition_id, current_cash)
competition_trades (participant_id, symbol, quantity, price)
```

This design ensures **complete isolation** between personal and competition trading while providing a seamless user experience for both modes.
