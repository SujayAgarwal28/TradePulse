"""
Test script to check social search functionality
"""
import requests
import json

def test_search_endpoint():
    """Test the user search functionality"""
    
    # First, login to get a valid token
    print("🔑 Logging in to get access token...")
    
    login_data = {
        'username': 'test@tradepulse.com',
        'password': 'testpassword123'
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/auth/login",
            data=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data['access_token']
            print(f"✅ Login successful! Token: {access_token[:20]}...")
            
            # Test search endpoint
            print("\n🔍 Testing user search...")
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Test searching for users
            search_queries = ['alice', 'bob', 'charlie', 'diana', 'tradepulse', '@']
            
            for query in search_queries:
                print(f"\n📋 Searching for: '{query}'")
                
                search_response = requests.get(
                    f"http://localhost:8000/social/search?q={query}",
                    headers=headers,
                    timeout=10
                )
                
                if search_response.status_code == 200:
                    results = search_response.json()
                    print(f"✅ Search successful! Found {len(results)} users")
                    
                    for user in results:
                        print(f"   - {user.get('username', 'No username')} ({user.get('email', 'No email')})")
                        print(f"     ID: {user.get('id')}, Active: {user.get('is_active')}")
                else:
                    print(f"❌ Search failed: {search_response.status_code}")
                    print(f"   Response: {search_response.text}")
        
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_user_creation():
    """Create some test users for search testing"""
    print("\n👥 Creating test users for search...")
    
    test_users = [
        {"email": "alice@tradepulse.com", "password": "password123"},
        {"email": "bob@tradepulse.com", "password": "password123"},
        {"email": "charlie@tradepulse.com", "password": "password123"},
        {"email": "diana@tradepulse.com", "password": "password123"},
    ]
    
    for user_data in test_users:
        try:
            response = requests.post(
                "http://localhost:8000/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                user = response.json()
                print(f"✅ Created user: {user.get('email')} (ID: {user.get('id')})")
            elif response.status_code == 400:
                print(f"⚠️  User {user_data['email']} already exists")
            else:
                print(f"❌ Failed to create {user_data['email']}: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error creating {user_data['email']}: {e}")

if __name__ == "__main__":
    print("🔍 TradePulse Social Search Test")
    print("=" * 40)
    
    # Create test users first
    test_user_creation()
    
    # Test search functionality
    test_search_endpoint()
    
    print("\n" + "=" * 40)
    print("🏁 Search test complete!")
