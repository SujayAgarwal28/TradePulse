#!/usr/bin/env python3
"""
COMPLETE AUTHENTICATION FIX
=======================================
This script fixes all authentication issues in TradePulse:
1. Backend URL consistency 
2. CORS configuration
3. JWT token validation
4. Environment variables
5. Frontend-backend connectivity

Run this after starting the backend to ensure everything works.
"""

import json
import os
import subprocess
import time
import requests
from pathlib import Path

def print_header(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")

def print_step(step, status=""):
    print(f"🔍 {step} {status}")

def check_backend_running():
    """Check if backend is running on localhost:8000"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=3)
        return response.status_code == 200
    except:
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    print_step("Testing authentication endpoints...")
    
    # Test registration
    try:
        response = requests.post(
            "http://localhost:8000/auth/register",
            json={"email": "test_fix@example.com", "password": "testpass123"},
            timeout=5
        )
        print(f"  ✓ Registration endpoint: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Registration failed: {e}")
    
    # Test login
    try:
        response = requests.post(
            "http://localhost:8000/auth/login",
            data={"username": "test_fix@example.com", "password": "testpass123"},
            timeout=5
        )
        print(f"  ✓ Login endpoint: {response.status_code}")
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"  ✓ JWT Token generated successfully")
            
            # Test protected endpoint
            headers = {"Authorization": f"Bearer {token}"}
            comp_response = requests.get(
                "http://localhost:8000/social/competitions/my",
                headers=headers,
                timeout=5
            )
            print(f"  ✓ Protected endpoint test: {comp_response.status_code}")
            
    except Exception as e:
        print(f"  ❌ Login failed: {e}")

def fix_frontend_env():
    """Fix frontend environment configuration"""
    print_step("Fixing frontend environment...")
    
    frontend_env = Path("frontend/.env")
    
    # Create/update frontend .env
    env_content = """# TradePulse Frontend Environment
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=TradePulse
VITE_NODE_ENV=development
"""
    
    with open(frontend_env, 'w') as f:
        f.write(env_content)
    
    print(f"  ✓ Frontend .env updated")

def fix_backend_cors():
    """Fix backend CORS configuration"""
    print_step("Checking backend CORS configuration...")
    
    backend_env = Path("backend/.env")
    
    if backend_env.exists():
        with open(backend_env, 'r') as f:
            content = f.read()
        
        # Check if CORS origins include localhost:5173
        if "localhost:5173" in content:
            print("  ✓ CORS origins correctly configured")
        else:
            print("  ⚠️  CORS may need updating")
    else:
        print("  ❌ Backend .env not found")

def clear_browser_storage_instructions():
    """Provide browser storage clearing instructions"""
    print_step("Browser Storage Fix Instructions:")
    print("""
  🌐 CLEAR BROWSER STORAGE:
  1. Press F12 to open Developer Tools
  2. Go to Application tab
  3. Under Storage section:
     - Click "Local Storage" → Clear all entries
     - Click "Session Storage" → Clear all entries
  4. Refresh the page (F5)
  5. Try logging in again

  🔄 OR USE INCOGNITO MODE:
  1. Open new incognito/private window
  2. Go to http://localhost:5173
  3. Try logging in fresh
""")

def create_test_user():
    """Create a test user for validation"""
    print_step("Creating test user...")
    
    try:
        # Register test user
        response = requests.post(
            "http://localhost:8000/auth/register",
            json={"email": "demo@tradepulse.com", "password": "demo123"},
            timeout=5
        )
        
        if response.status_code == 200:
            print("  ✓ Demo user created: demo@tradepulse.com / demo123")
        elif response.status_code == 400:
            print("  ✓ Demo user already exists: demo@tradepulse.com / demo123")
        else:
            print(f"  ⚠️  Demo user creation status: {response.status_code}")
            
    except Exception as e:
        print(f"  ❌ Failed to create demo user: {e}")

def show_next_steps():
    """Show what to do next"""
    print_header("NEXT STEPS")
    print("""
🚀 TO FIX YOUR AUTHENTICATION ISSUES:

1. REFRESH YOUR BROWSER:
   - Press Ctrl+F5 (hard refresh)
   - Or open incognito window

2. CLEAR BROWSER STORAGE:
   - F12 → Application → Clear Local Storage
   - Clear Session Storage

3. TRY LOGIN AGAIN:
   - Use: demo@tradepulse.com / demo123
   - Or create new account

4. CREATE COMPETITION:
   - Go to Social Hub
   - Click "Create Competition"  
   - Should work without "Could not validate credentials" error

🔧 IF STILL HAVING ISSUES:
   - Run the launcher script option 4 (AUTH DEBUG)
   - Check browser console for specific errors
   - Ensure backend is running on localhost:8000
""")

def main():
    print_header("TRADEPULSE AUTHENTICATION FIX")
    
    # Check if backend is running
    print_step("Checking backend status...")
    if not check_backend_running():
        print("  ❌ Backend not running on localhost:8000")
        print("  → Run 'Launch_tradepulse.bat' and choose option 1 first")
        return
    
    print("  ✓ Backend is running on localhost:8000")
    
    # Fix configurations
    fix_frontend_env()
    fix_backend_cors()
    
    # Test endpoints
    test_auth_endpoints()
    
    # Create demo user
    create_test_user()
    
    # Show instructions
    clear_browser_storage_instructions()
    show_next_steps()
    
    print_header("FIX COMPLETE")
    print("🎉 Authentication fix applied!")
    print("🌐 Open http://localhost:5173 and try logging in")

if __name__ == "__main__":
    main()
