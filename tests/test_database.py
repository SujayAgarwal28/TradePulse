"""
Test script to debug database and search functionality
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_user_registration():
    """Test registering new users to ensure they exist"""
    test_users = [
        {"email": "alice@tradepulse.com", "password": "password123"},
        {"bob_email": "bob@tradepulse.com", "password": "password123"},
        {"charlie_email": "charlie@tradepulse.com", "password": "password123"},
        {"diana_email": "diana@tradepulse.com", "password": "password123"}
    ]
    
    print("🧪 Testing user registration...")
    for user in test_users:
        try:
            response = requests.post(f"{BASE_URL}/auth/register", json=user)
            print(f"Register {user}: {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"Error registering {user}: {e}")

def test_user_search():
    """Test search functionality"""
    search_queries = ["alice", "bob", "charlie", "diana", "tradepulse", "@tradepulse.com"]
    
    print("\n🧪 Testing user search...")
    for query in search_queries:
        try:
            response = requests.get(f"{BASE_URL}/social/search", params={"query": query})
            result = response.json()
            print(f"Search '{query}': {response.status_code} - Found {len(result.get('users', []))} users")
            if result.get('users'):
                for user in result['users']:
                    print(f"  - {user.get('email', 'N/A')} ({user.get('username', 'No username')})")
        except Exception as e:
            print(f"Error searching '{query}': {e}")

def test_list_users():
    """Test getting all users to see what exists in database"""
    print("\n🧪 Testing if we can get user list...")
    try:
        # Try a generic auth endpoint to see if there's a way to list users
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code}")
        
        # Try different search patterns
        response = requests.get(f"{BASE_URL}/social/search", params={"query": ""})
        print(f"Empty search: {response.status_code} - {response.text[:200]}")
        
        response = requests.get(f"{BASE_URL}/social/search", params={"query": "*"})
        print(f"Wildcard search: {response.status_code} - {response.text[:200]}")
        
    except Exception as e:
        print(f"Error in list users test: {e}")

if __name__ == "__main__":
    test_user_registration()
    test_user_search()
    test_list_users()
