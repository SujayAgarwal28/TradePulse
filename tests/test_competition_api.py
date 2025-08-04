#!/usr/bin/env python3
"""
Test script to verify TradePulse competition system endpoints.
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health():
    """Test if the API is running."""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_register_user(username, email, password):
    """Register a new user."""
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json={
            "username": username,
            "email": email,
            "password": password,
            "full_name": f"Test User {username}"
        })
        print(f"📝 Register {username}: {response.status_code}")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Registration failed for {username}: {e}")
        return None

def test_login(email, password):
    """Login and get access token."""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data={
            "username": email,
            "password": password
        })
        print(f"🔑 Login: {response.status_code}")
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return None

def test_get_competitions(token=None):
    """Get list of competitions."""
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        response = requests.get(f"{BASE_URL}/social/competitions", headers=headers)
        print(f"🏆 Get competitions: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data.get('competitions', []))} competitions")
            return data.get('competitions', [])
        else:
            print(f"   Error: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Get competitions failed: {e}")
        return []

def test_create_competition(token, name="Test Competition"):
    """Create a new competition."""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/social/competitions", 
            headers=headers,
            json={
                "name": name,
                "description": "Test competition for API testing",
                "duration_hours": 24,
                "starting_balance": 10000,
                "max_participants": 5,
                "is_public": True
            }
        )
        print(f"🏁 Create competition: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Created competition ID: {data['competition_id']}")
            return data['competition_id']
        else:
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Create competition failed: {e}")
        return None

def test_join_competition(token, competition_id):
    """Join a competition."""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/social/competitions/{competition_id}/join", 
            headers=headers
        )
        print(f"🎯 Join competition {competition_id}: {response.status_code}")
        if response.status_code == 200:
            print(f"   Successfully joined competition")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Join competition failed: {e}")
        return False

def test_get_competition_portfolio(token, competition_id):
    """Get competition portfolio."""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/competitions/{competition_id}/portfolio", 
            headers=headers
        )
        print(f"💼 Get competition portfolio: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Portfolio value: ${data.get('total_value', 0)}")
            print(f"   Cash: ${data.get('cash_balance', 0)}")
            return data
        else:
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Get portfolio failed: {e}")
        return None

def test_competition_trade(token, competition_id, symbol="AAPL", quantity=1):
    """Test competition trading."""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/competitions/{competition_id}/trade", 
            headers=headers,
            json={
                "symbol": symbol,
                "quantity": quantity,
                "order_type": "buy"
            }
        )
        print(f"💰 Competition trade {symbol}: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Trade successful: {data.get('success')}")
            print(f"   Executed price: ${data.get('executed_price', 0)}")
            return data
        else:
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Competition trade failed: {e}")
        return None

def main():
    """Run comprehensive API tests."""
    print("🚀 TradePulse Competition API Test Suite")
    print("=" * 50)
    
    # Test basic connectivity
    if not test_health():
        print("❌ API is not running. Please start the backend first.")
        return
    
    # Test user registration and authentication
    print("\n📋 Testing User Management...")
    user1_data = test_register_user("testuser1", "test1@example.com", "password123")
    user2_data = test_register_user("testuser2", "test2@example.com", "password123")
    
    # Login users
    token1 = test_login("test1@example.com", "password123")
    token2 = test_login("test2@example.com", "password123")
    
    if not token1:
        print("❌ Cannot continue without authentication")
        return
    
    # Test competition system
    print("\n🏆 Testing Competition System...")
    competitions = test_get_competitions(token1)
    
    # Create a new competition
    comp_id = test_create_competition(token1, "API Test Competition")
    if not comp_id:
        print("❌ Cannot continue without a competition")
        return
    
    # Join competition
    test_join_competition(token1, comp_id)
    if token2:
        test_join_competition(token2, comp_id)
    
    # Test portfolio
    test_get_competition_portfolio(token1, comp_id)
    
    # Test trading
    test_competition_trade(token1, comp_id, "AAPL", 2)
    
    # Check portfolio after trade
    test_get_competition_portfolio(token1, comp_id)
    
    print("\n✅ API Test Suite Completed!")

if __name__ == "__main__":
    main()
