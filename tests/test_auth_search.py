"""
Test script to debug database and search functionality with authentication
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_login_and_search():
    """Test login and then search functionality"""
    # First try to login with our test user (OAuth2 form data)
    login_data = {"username": "alice@tradepulse.com", "password": "password123"}
    
    print("🧪 Testing login...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        print(f"Login response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Login successful! Got token: {result.get('access_token', 'N/A')[:20]}...")
            token = result.get('access_token')
            
            if token:
                # Now test search with authentication
                headers = {"Authorization": f"Bearer {token}"}
                print("\n🧪 Testing authenticated search...")
                
                search_queries = ["alice", "bob", "charlie", "diana", "tradepulse", "@tradepulse.com"]
                
                for query in search_queries:
                    try:
                        response = requests.get(f"{BASE_URL}/social/search", 
                                              params={"q": query}, 
                                              headers=headers)
                        result = response.json()
                        print(f"Search '{query}': {response.status_code} - Found {len(result) if isinstance(result, list) else 0} users")
                        if isinstance(result, list) and result:
                            for user in result:
                                print(f"  - {user.get('email', 'N/A')} ({user.get('username', 'No username')})")
                    except Exception as e:
                        print(f"Error searching '{query}': {e}")
                        
                # Test a longer search query 
                print("\n🧪 Testing longer search query...")
                try:
                    response = requests.get(f"{BASE_URL}/social/search", 
                                          params={"q": "tradepulse"}, 
                                          headers=headers)
                    result = response.json()
                    print(f"Longer search: {response.status_code} - Found {len(result) if isinstance(result, list) else 0} users")
                    if isinstance(result, list) and result:
                        for user in result:
                            print(f"  - {user.get('email', 'N/A')} ({user.get('username', 'No username')})")
                except Exception as e:
                    print(f"Error in longer search: {e}")
            else:
                print("No token received from login!")
        else:
            print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Error during login: {e}")

if __name__ == "__main__":
    test_login_and_search()
