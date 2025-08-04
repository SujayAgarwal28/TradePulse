"""
Quick test to verify portfolio data isolation
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_portfolio():
    print("🧪 Testing Portfolio Data Isolation...")
    
    # Create two different users
    users = [
        {"email": "user1@test.com", "password": "password123"},
        {"email": "user2@test.com", "password": "password123"}
    ]
    
    for i, user in enumerate(users, 1):
        print(f"\n--- Testing User {i}: {user['email']} ---")
        
        # Register user (ignore if exists)
        register_response = requests.post(f"{BASE_URL}/auth/register", json=user)
        if register_response.status_code == 200:
            print(f"✅ User {i} created")
        else:
            print(f"ℹ️  User {i} already exists")
        
        # Login
        login_data = {"username": user["email"], "password": user["password"]}
        login_response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed for user {i}: {login_response.json()}")
            continue
            
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✅ User {i} logged in")
        
        # Check portfolio value
        portfolio_response = requests.get(f"{BASE_URL}/portfolio/value", headers=headers)
        if portfolio_response.status_code == 200:
            data = portfolio_response.json()
            print(f"💰 User {i} Portfolio:")
            print(f"   Cash Balance: ${data.get('cash_balance', 0)}")
            print(f"   Total Value: ${data.get('total_value', 0)}")
            print(f"   Portfolio ID: {data.get('portfolio_id', 'N/A')}")
        else:
            print(f"❌ Portfolio check failed for user {i}: {portfolio_response.status_code}")
            print(f"   Response: {portfolio_response.text}")

if __name__ == "__main__":
    test_portfolio()
