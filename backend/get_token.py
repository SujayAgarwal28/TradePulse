"""
Get a real token for frontend testing
"""
import requests

BASE_URL = "http://localhost:8000"

def get_test_token():
    # Login with existing user
    login_data = {"username": "user1@test.com", "password": "password123"}
    login_response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        print("✅ Real auth token for testing:")
        print(f"Bearer {token}")
        print("\n📋 To test in browser:")
        print(f"localStorage.setItem('tradepulse_token', '{token}')")
        print("\n🔄 Then refresh the dashboard page")
        
        # Test the token works
        headers = {"Authorization": f"Bearer {token}"}
        portfolio_response = requests.get(f"{BASE_URL}/portfolio/value", headers=headers)
        if portfolio_response.status_code == 200:
            data = portfolio_response.json()
            print(f"\n✅ Token works! Portfolio data:")
            print(f"   Cash Balance: ${data.get('cash_balance', 0)}")
            print(f"   Total Value: ${data.get('total_value', 0)}")
            print(f"   Portfolio ID: {data.get('portfolio_id', 'N/A')}")
        else:
            print(f"❌ Token test failed: {portfolio_response.status_code}")
    else:
        print(f"❌ Login failed: {login_response.json()}")

if __name__ == "__main__":
    get_test_token()
