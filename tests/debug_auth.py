"""
Debug script to test TradePulse authentication endpoints
Run this to diagnose login issues
"""
import requests
import json
import asyncio
import aiohttp
from datetime import datetime

# Backend URLs to test
BACKEND_URLS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://0.0.0.0:8000"
]

def test_health_endpoint():
    """Test if backend is running"""
    print("=" * 50)
    print("🔍 TESTING BACKEND HEALTH ENDPOINTS")
    print("=" * 50)
    
    for url in BACKEND_URLS:
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ {url}/health - Backend is ONLINE")
                data = response.json()
                print(f"   Response: {data}")
                return url
            else:
                print(f"❌ {url}/health - Status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"❌ {url}/health - Connection refused")
        except requests.exceptions.Timeout:
            print(f"❌ {url}/health - Timeout")
        except Exception as e:
            print(f"❌ {url}/health - Error: {e}")
    
    print("\n🚨 NO BACKEND FOUND! Please start the backend first.")
    return None

def test_auth_endpoints(base_url):
    """Test authentication endpoints"""
    print("\n" + "=" * 50)
    print("🔐 TESTING AUTHENTICATION ENDPOINTS")
    print("=" * 50)
    
    # Test 1: Register a test user
    print("\n📝 Testing user registration...")
    test_user = {
        "email": "test@tradepulse.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Registration successful")
            user_data = response.json()
            print(f"   User ID: {user_data.get('id')}")
            print(f"   Email: {user_data.get('email')}")
        elif response.status_code == 400:
            print("⚠️  User already exists (this is okay)")
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Registration error: {e}")
    
    # Test 2: Login with test user
    print("\n🔑 Testing user login...")
    
    # Method 1: Form data (FastAPI OAuth2PasswordRequestForm)
    try:
        form_data = {
            'username': test_user['email'],  # FastAPI uses 'username' field
            'password': test_user['password']
        }
        
        response = requests.post(
            f"{base_url}/auth/login",
            data=form_data,  # Use data, not json for form
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Login successful (Form method)")
            token_data = response.json()
            print(f"   Access token: {token_data.get('access_token')[:20]}...")
            print(f"   Token type: {token_data.get('token_type')}")
            print(f"   Expires in: {token_data.get('expires_in')} seconds")
            
            # Test protected endpoint
            token = token_data.get('access_token')
            test_protected_endpoint(base_url, token)
            
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Login error: {e}")

def test_protected_endpoint(base_url, token):
    """Test accessing protected endpoint with token"""
    print("\n🛡️  Testing protected endpoint...")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{base_url}/auth/me",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Protected endpoint access successful")
            user_data = response.json()
            print(f"   User ID: {user_data.get('id')}")
            print(f"   Email: {user_data.get('email')}")
        else:
            print(f"❌ Protected endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Protected endpoint error: {e}")

def test_cors():
    """Test CORS configuration"""
    print("\n" + "=" * 50)
    print("🌐 TESTING CORS CONFIGURATION")
    print("=" * 50)
    
    for url in BACKEND_URLS:
        try:
            # Test preflight request
            response = requests.options(
                f"{url}/auth/login",
                headers={
                    "Origin": "http://localhost:5173",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type"
                },
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ {url} - CORS preflight successful")
                cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
                for header, value in cors_headers.items():
                    print(f"   {header}: {value}")
            else:
                print(f"❌ {url} - CORS preflight failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ {url} - CORS test error: {e}")

def main():
    """Main diagnostic function"""
    print("🔍 TradePulse Authentication Diagnostics")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Test backend health
    backend_url = test_health_endpoint()
    
    if backend_url:
        # Step 2: Test authentication
        test_auth_endpoints(backend_url)
        
        # Step 3: Test CORS
        test_cors()
    
    print("\n" + "=" * 50)
    print("🏁 DIAGNOSTIC COMPLETE")
    print("=" * 50)
    
    if not backend_url:
        print("\n🚨 ISSUE FOUND: Backend is not running!")
        print("💡 SOLUTION: Run your backend server:")
        print("   cd backend")
        print("   python run_dev.py")
    else:
        print(f"\n✅ Backend is running at: {backend_url}")
        print("💡 If login still fails from frontend, check:")
        print("   1. Browser console for detailed errors")
        print("   2. Network tab in browser dev tools")
        print("   3. Try clearing browser cache/cookies")

if __name__ == "__main__":
    main()
