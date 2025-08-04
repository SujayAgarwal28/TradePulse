"""
Test script to verify that different users get different portfolio data
"""
import requests

BASE_URL = "http://localhost:8000"

def test_portfolio_isolation():
    """Test that different users get different portfolio data"""
    
    # Test users
    users = [
        {"email": "alice@tradepulse.com", "password": "password123"},
        {"email": "bob@tradepulse.com", "password": "password123"}
    ]
    
    print("🧪 Testing portfolio data isolation between users...")
    
    user_portfolios = {}
    
    for i, user_data in enumerate(users):
        print(f"\n--- Testing User {i+1}: {user_data['email']} ---")
        
        # Login
        try:
            login_data = {"username": user_data["email"], "password": user_data["password"]}
            login_response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
            if login_response.status_code == 200:
                token = login_response.json().get('access_token')
                print(f"✅ Login successful for {user_data['email']}")
                
                # Get portfolio data
                headers = {"Authorization": f"Bearer {token}"}
                portfolio_response = requests.get(f"{BASE_URL}/portfolio/value", headers=headers)
                
                if portfolio_response.status_code == 200:
                    portfolio_data = portfolio_response.json()
                    user_portfolios[user_data['email']] = portfolio_data
                    
                    print(f"📊 Portfolio data:")
                    print(f"   Portfolio ID: {portfolio_data.get('portfolio_id', 'N/A')}")
                    print(f"   Cash Balance: ${portfolio_data.get('cash_balance', 0):,.2f}")
                    print(f"   Total Value: ${portfolio_data.get('total_value', 0):,.2f}")
                    print(f"   Positions: {len(portfolio_data.get('positions', []))}")
                else:
                    print(f"❌ Failed to get portfolio: {portfolio_response.status_code}")
            else:
                print(f"❌ Login failed: {login_response.status_code}")
                
        except Exception as e:
            print(f"❌ Error testing {user_data['email']}: {e}")
    
    # Compare portfolios
    print(f"\n🔍 Portfolio Isolation Analysis:")
    emails = list(user_portfolios.keys())
    
    if len(emails) >= 2:
        portfolio1 = user_portfolios[emails[0]]
        portfolio2 = user_portfolios[emails[1]]
        
        print(f"\nUser 1 ({emails[0]}):")
        print(f"  Portfolio ID: {portfolio1.get('portfolio_id')}")
        print(f"  Cash: ${portfolio1.get('cash_balance', 0):,.2f}")
        print(f"  Total: ${portfolio1.get('total_value', 0):,.2f}")
        
        print(f"\nUser 2 ({emails[1]}):")
        print(f"  Portfolio ID: {portfolio2.get('portfolio_id')}")
        print(f"  Cash: ${portfolio2.get('cash_balance', 0):,.2f}")
        print(f"  Total: ${portfolio2.get('total_value', 0):,.2f}")
        
        # Check if they're different
        if portfolio1.get('portfolio_id') == portfolio2.get('portfolio_id'):
            print("\n❌ PROBLEM: Users have the same portfolio ID!")
        else:
            print("\n✅ GOOD: Users have different portfolio IDs")
            
        if (portfolio1.get('cash_balance') == portfolio2.get('cash_balance') and 
            portfolio1.get('total_value') == portfolio2.get('total_value')):
            print("⚠️  WARNING: Users have identical cash/total values (could be coincidence)")
        else:
            print("✅ GOOD: Users have different portfolio values")
    else:
        print("❌ Could not test isolation - need at least 2 successful logins")

if __name__ == "__main__":
    test_portfolio_isolation()
