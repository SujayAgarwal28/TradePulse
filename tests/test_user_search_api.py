#!/usr/bin/env python3
"""
Test script for user search functionality with authentication
"""
import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_user_search():
    print("🔍 Testing User Search API with Authentication")
    print("=" * 60)
    
    # First, login to get a token
    print("1️⃣ Logging in to get authentication token...")
    login_data = {
        "username": "searchtester@example.com",  # Using the test user we created
        "password": "testpass123"
    }
    
    try:
        # Try to login
        login_response = requests.post(f"{API_BASE_URL}/auth/login", data=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            # Try to register first
            print("2️⃣ Trying to register a new test user...")
            register_data = {
                "email": "test@example.com",
                "password": "testpass123"
            }
            register_response = requests.post(f"{API_BASE_URL}/auth/register", json=register_data)
            if register_response.status_code == 201:
                print("✅ Test user registered successfully")
                # Now try to login with the new user
                login_data = {"username": "test@example.com", "password": "testpass123"}
                login_response = requests.post(f"{API_BASE_URL}/auth/login", data=login_data)
            else:
                print(f"❌ Registration failed: {register_response.status_code} - {register_response.text}")
                return
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get("access_token")
            print(f"✅ Login successful! Token: {access_token[:20]}...")
            
            # Test user search
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Test different search queries
            search_queries = ["test", "john", "alice", "trader", "demo"]
            
            for query in search_queries:
                print(f"\n3️⃣ Searching for users with query: '{query}'")
                search_response = requests.get(
                    f"{API_BASE_URL}/social/search", 
                    params={"q": query, "limit": 5},
                    headers=headers
                )
                
                if search_response.status_code == 200:
                    results = search_response.json()
                    print(f"✅ Found {len(results)} users:")
                    for user in results:
                        print(f"   👤 {user.get('username', 'No username')} - {user.get('full_name', 'No name')} ({user.get('email', 'No email')})")
                        print(f"      🏆 Wins: {user.get('competition_wins', 0)} | ⭐ Points: {user.get('rank_points', 0)} | Friend: {user.get('is_friend', False)}")
                else:
                    print(f"❌ Search failed: {search_response.status_code} - {search_response.text}")
        else:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error occurred: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 User Search Test Summary:")
    print("✅ API endpoint: /social/search")
    print("✅ Authentication: Required (Bearer token)")
    print("✅ Parameters: q (query), limit (optional)")
    print("✅ Returns: List of users with profile info")
    print("\n📋 Frontend Integration Instructions:")
    print("1. Login to get access token")
    print("2. Use UserSearchDropdown component")
    print("3. Type at least 2 characters to trigger search")
    print("4. Results appear in dropdown with spinner")
    print("5. Click on user to select or view profile")

if __name__ == "__main__":
    test_user_search()
