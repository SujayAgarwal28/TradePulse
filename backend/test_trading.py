"""
Quick test script to verify trading functionality
Run this after registering a user in the frontend
"""
import requests
import json

# Base URL
BASE_URL = "http://localhost:8000"

def test_trading():
    # Test data
    email = "test@example.com"
    password = "password123"
    
    print("🧪 Testing TradePulse Trading System...")
    
    # 1. Register user
    print("\n1. Creating test user...")
    register_data = {
        "email": email,
        "password": password
    }
    
    register_response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    if register_response.status_code == 200:
        print("✅ User created successfully")
    else:
        print(f"⚠️  User might already exist: {register_response.json()}")
    
    # 2. Login to get token
    print("\n2. Logging in...")
    login_data = {
        "username": email,  # OAuth2PasswordRequestForm expects username field
        "password": password
    }
    login_response = requests.post(f"{BASE_URL}/auth/login", data=login_data)  # Use data, not json
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.json()}")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")
    
    # 3. Check portfolio
    print("\n3. Checking portfolio...")
    portfolio_response = requests.get(f"{BASE_URL}/trading/portfolio", headers=headers)
    if portfolio_response.status_code == 200:
        portfolio = portfolio_response.json()
        print(f"✅ Portfolio balance: ${portfolio['cash_balance']}")
    else:
        print(f"❌ Portfolio check failed: {portfolio_response.json()}")
        return
    
    # 4. Get stock info
    print("\n4. Getting AAPL stock info...")
    stock_response = requests.get(f"{BASE_URL}/stocks/AAPL", headers=headers)
    if stock_response.status_code == 200:
        stock = stock_response.json()
        print(f"✅ AAPL price: ${stock['current_price']}")
    else:
        print(f"❌ Stock info failed: {stock_response.json()}")
        return
    
    # 5. Execute buy trade
    print("\n5. Buying 1 share of AAPL...")
    trade_data = {
        "symbol": "AAPL",
        "quantity": 1,
        "order_type": "buy"
    }
    
    trade_response = requests.post(f"{BASE_URL}/trading/execute", json=trade_data, headers=headers)
    if trade_response.status_code == 200:
        trade_result = trade_response.json()
        print(f"✅ Trade successful: {trade_result}")
    else:
        print(f"❌ Trade failed: {trade_response.json()}")
        return
    
    # 6. Check portfolio again
    print("\n6. Checking portfolio after trade...")
    portfolio_response = requests.get(f"{BASE_URL}/trading/portfolio", headers=headers)
    if portfolio_response.status_code == 200:
        portfolio = portfolio_response.json()
        print(f"✅ New portfolio balance: ${portfolio['cash_balance']}")
        print(f"✅ Total portfolio value: ${portfolio['total_portfolio_value']}")
        if portfolio['positions']:
            print(f"✅ Positions: {portfolio['positions']}")
    else:
        print(f"❌ Portfolio check failed: {portfolio_response.json()}")
    
    print("\n🎉 Trading test completed!")

if __name__ == "__main__":
    test_trading()
