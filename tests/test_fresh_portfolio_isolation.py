"""
Test portfolio isolation with fresh user registrations
"""
import requests
import random
import string

BASE_URL = "http://localhost:8000"

def generate_test_email():
    """Generate a unique test email"""
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{random_suffix}@tradepulse.com"

def test_portfolio_isolation_fresh_users():
    """Test portfolio isolation by creating two fresh users"""
    
    print("🧪 Testing portfolio isolation with fresh user registrations...")
    
    # Create two fresh test users
    users = [
        {"email": generate_test_email(), "password": "password123"},
        {"email": generate_test_email(), "password": "password123"}
    ]
    
    print(f"Creating test users: {users[0]['email']} and {users[1]['email']}")
    
    user_portfolios = {}
    
    for i, user_data in enumerate(users):
        print(f"\n--- Testing User {i+1}: {user_data['email']} ---")
        
        try:
            # Register user first
            print(f"🔧 Registering {user_data['email']}...")
            register_response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
            
            if register_response.status_code == 200:
                print(f"✅ Registration successful")
                
                # Login
                login_data = {"username": user_data["email"], "password": user_data["password"]}
                login_response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
                
                if login_response.status_code == 200:
                    token = login_response.json().get('access_token')
                    print(f"✅ Login successful")
                    
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
                        print(f"❌ Portfolio fetch failed: {portfolio_response.status_code}")
                        print(f"   Response: {portfolio_response.text[:200]}")
                else:
                    print(f"❌ Login failed: {login_response.status_code}")
            else:
                print(f"❌ Registration failed: {register_response.status_code}")
                if register_response.status_code == 400:
                    print("   (This might be expected if user already exists)")
                    
                    # Try login anyway
                    login_data = {"username": user_data["email"], "password": user_data["password"]}
                    login_response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
                    
                    if login_response.status_code == 200:
                        token = login_response.json().get('access_token')
                        print(f"✅ Login successful with existing user")
                        
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
            print("\n❌ CRITICAL PROBLEM: Users have the same portfolio ID!")
            print("   This confirms the data isolation bug!")
        else:
            print("\n✅ GOOD: Users have different portfolio IDs")
            
        if (portfolio1.get('cash_balance') == portfolio2.get('cash_balance') and 
            portfolio1.get('total_value') == portfolio2.get('total_value')):
            if portfolio1.get('cash_balance') == 100000:
                print("✅ EXPECTED: Both users have default starting values (100k)")
            else:
                print("⚠️  WARNING: Users have identical non-default values")
        else:
            print("✅ GOOD: Users have different portfolio values")
            
        # Final verdict
        if portfolio1.get('portfolio_id') != portfolio2.get('portfolio_id'):
            print("\n🎉 CONCLUSION: Portfolio data isolation is working correctly!")
        else:
            print("\n💥 CONCLUSION: Portfolio data isolation is BROKEN!")
            
    else:
        print("❌ Could not test isolation - need at least 2 successful logins")

if __name__ == "__main__":
    test_portfolio_isolation_fresh_users()
