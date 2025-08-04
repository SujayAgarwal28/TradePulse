# TradePulse Phase 2 - Implementation Plan & Roadmap

## 📋 **Current Project Analysis**

### **✅ Working Components**
- User authentication system with JWT tokens
- Real-time stock data integration via Yahoo Finance API
- Portfolio management with live P&L calculations
- Trading system with buy/sell functionality
- Responsive UI with TailwindCSS
- Database integration with PostgreSQL/SQLite

### **⚠️ Issues Identified**
1. **Portfolio Page Issues:**
   - Performance metrics (30 days, daily P&L) are hardcoded with mock data
   - Risk analysis shows static values
   - PDF export button is non-functional
   - Some calculations may be inaccurate

2. **Dashboard Overlap:**
   - Dashboard and Portfolio pages have overlapping functionality
   - Need clear separation of market-centric vs user-centric data

3. **Missing Features:**
   - No user profile/settings page
   - No trading challenge system
   - Limited to stock trading only (no indices/options)

---

## 🛣️ **PHASE 2 IMPLEMENTATION ROADMAP**

### **PHASE 2A: Fix Portfolio Issues ✅ COMPLETED**
**Priority: HIGH - Fix Broken Functionality**

#### **2A.1: Fix Portfolio Performance Metrics ✅ COMPLETED**
- ✅ Replaced hardcoded performance data with real calculations
- ✅ Implemented actual 30-day portfolio performance tracking
- ✅ Calculate real daily P&L based on trade history
- ✅ Fixed risk analysis with portfolio-based calculations

#### **2A.2: Implement Real Portfolio History ✅ COMPLETED**
- ✅ Created portfolio value tracking over time
- ✅ Store daily portfolio snapshots (via service calculations)
- ✅ Calculate actual Sharpe ratio, max drawdown, win rate
- ✅ Generate real cumulative P&L charts

#### **2A.3: Fix Export Functionality ✅ COMPLETED**
- ✅ Implemented working PDF export for portfolio reports using jsPDF
- ✅ Added comprehensive portfolio summaries with real data
- ✅ Created downloadable portfolio performance reports

**Implementation Details:**
- **Backend:** Enhanced `portfolio/services.py` with real calculation methods
- **Backend:** Added `/portfolio/metrics` and `/portfolio/history` API endpoints
- **Frontend:** Completely refactored `Portfolio.tsx` with real data integration
- **Frontend:** Implemented working PDF export with comprehensive portfolio data
- **Bug Fixes:** Resolved authentication issues, duplicate imports, and interface conflicts

#### **Database Changes Required:**
```sql
-- Add portfolio history tracking
CREATE TABLE portfolio_history (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES portfolios(id),
    date DATE NOT NULL,
    total_value NUMERIC(15,2),
    cash_balance NUMERIC(15,2),
    stock_value NUMERIC(15,2),
    day_change NUMERIC(15,2),
    day_change_percent NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(portfolio_id, date)
);

-- Add performance metrics cache
CREATE TABLE portfolio_metrics (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES portfolios(id),
    period_days INTEGER,
    sharpe_ratio NUMERIC(8,4),
    max_drawdown NUMERIC(8,4),
    volatility NUMERIC(8,4),
    win_rate NUMERIC(5,2),
    total_trades INTEGER,
    profitable_trades INTEGER,
    calculated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **PHASE 2B: User Profile & Settings 🔄 READY TO START**
**Priority: MEDIUM - New Feature | NEXT PHASE**

#### **2B.1: Backend Profile System**
- Extend User model with profile fields (username, full_name, bio)
- Create profile management endpoints (`/auth/profile`, `/auth/update-profile`)
- Add portfolio reset functionality with confirmation
- Implement password change functionality with validation

#### **2B.2: Frontend Profile Page**
- Create Profile.tsx component with user information display
- Add profile navigation dropdown to navbar
- Implement settings management UI (theme, notifications)
- Add portfolio reset confirmation dialogs with warning messages

#### **2B.3: User Preferences System**
- Add theme switching (dark/light mode)
- Implement email notification preferences
- Track portfolio reset history and limits

#### **Database Schema Extensions:**
```sql
-- Extend users table
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN full_name VARCHAR(100);
ALTER TABLE users ADD COLUMN profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;

-- User preferences
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    email_notifications BOOLEAN DEFAULT true,
    portfolio_reset_count INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Implementation Priority:**
1. **Backend User Model Extensions** (Day 1-2)
2. **Profile API Endpoints** (Day 3-4)
3. **Frontend Profile Page** (Day 5-6)
4. **Navbar Integration** (Day 7)

---

### **PHASE 2C: Dashboard Enhancement (Week 3)**
**Priority: MEDIUM - Improve Existing**

#### **2C.1: Market-Centric Dashboard**
- Implement real market movers (top gainers/losers)
- Add live indices tracking (NIFTY 50, NASDAQ, S&P 500)
- Create watchlist management system
- Add market news feed integration

#### **2C.2: Remove Dashboard-Portfolio Overlap**
- Clear separation: Dashboard = Market data, Portfolio = User data
- Move user-specific metrics to Portfolio page only
- Focus Dashboard on market insights and trading opportunities

---

### **PHASE 2D: Trading Challenge System (Week 4-6)**
**Priority: LOW - Gamification Feature**

#### **2D.1: Challenge Infrastructure**
- Design challenge system architecture
- Implement user search and invitation system
- Create challenge-specific trading isolation
- Add challenge leaderboards and statistics

#### **Database Schema:**
```sql
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    challenger_id INTEGER REFERENCES users(id),
    opponent_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    virtual_capital NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    winner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE challenge_portfolios (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id),
    user_id INTEGER REFERENCES users(id),
    initial_balance NUMERIC(15,2),
    current_value NUMERIC(15,2),
    final_value NUMERIC(15,2),
    UNIQUE(challenge_id, user_id)
);

CREATE TABLE challenge_trades (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id),
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    trade_type VARCHAR(10) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

### **PHASE 2E: Index and Options Support (Week 7-8)**
**Priority: LOW - Advanced Features**

#### **2E.1: Index Trading**
- Add support for major indices (NIFTY 50, NASDAQ, S&P 500)
- Implement index price tracking
- Create index-specific trading interface

#### **2E.2: Basic Options Trading**
- Add simple options simulation (calls/puts)
- Implement basic options pricing model
- Create options-specific UI components

---

## 🛡️ **IMPLEMENTATION STRATEGY**

### **Safe Development Approach:**
1. **Incremental Changes:** Each phase builds upon previous without breaking existing functionality
2. **Database Migrations:** All schema changes are additive and non-destructive
3. **API Compatibility:** Extend existing endpoints, never break them
4. **Feature Flags:** New features can be toggled on/off during development
5. **Rollback Safety:** Each phase can be independently reverted if needed

### **Testing Strategy:**
- **Unit Tests:** For all new services and calculations
- **Integration Tests:** Verify existing functionality remains intact
- **User Testing:** Manual testing of all workflows after each phase
- **Performance Testing:** Ensure real-time calculations don't impact performance

### **Deployment Plan:**
- **Development Environment:** Test all changes locally first
- **Staging Deployment:** Deploy each phase to staging for validation
- **Production Rollout:** Gradual feature activation in production
- **Monitoring:** Track performance and user feedback for each phase

---

## 🎯 **CURRENT STATUS & NEXT STEPS**

### **✅ PHASE 2A COMPLETED**
**Portfolio Issues Fixed - All Core Functionality Working**
- Real portfolio performance metrics implemented
- Working PDF export functionality
- Dynamic charts with actual trade data
- Proper authentication and error handling
- No more hardcoded data in portfolio calculations

### **🔄 PHASE 2B - READY TO START**
**User Profile & Settings Implementation**

**Week 1 Focus - Backend Foundation:**
1. **Day 1-2:** Extend User model with profile fields
2. **Day 3-4:** Create profile management API endpoints  
3. **Day 5-6:** Add portfolio reset functionality with confirmation
4. **Day 7:** Implement password change endpoints

**Week 2 Focus - Frontend Implementation:**
1. **Day 1-3:** Create Profile.tsx page component
2. **Day 4-5:** Add profile dropdown to navbar navigation
3. **Day 6-7:** Implement settings UI (theme, notifications, portfolio reset)

### **Success Metrics for Phase 2B:**
- Users can view and edit their profile information
- Profile dropdown accessible from navbar
- Portfolio reset functionality with proper warnings
- Password change with security validation
- Theme switching between dark/light modes

---

## 🔧 **TECHNICAL IMPLEMENTATION NOTES**

### **Portfolio Calculations:**
- Implement time-weighted return calculations
- Use actual trade data for P&L computation
- Calculate rolling performance windows (7d, 30d, 90d)
- Store daily snapshots for historical analysis

### **Export Functionality:**
- Use libraries like `jsPDF` for PDF generation
- Implement CSV export with proper formatting
- Add email delivery option for reports

### **Performance Optimization:**
- Cache calculated metrics for performance
- Use background tasks for heavy computations
- Implement efficient database queries for large datasets

---

This implementation plan ensures systematic, safe development while addressing the most critical issues first and building towards the full Phase 2 vision.
