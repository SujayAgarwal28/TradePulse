#!/usr/bin/env python3
"""
AUTHENTICATION DIAGNOSTIC TOOL
==============================
Tests authentication flow step-by-step to identify the exact issue
causing "Could not validate credentials" errors.
"""

import requests
import json
import sys
from datetime import datetime

def print_step(step, status="TESTING"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {step} - {status}")

def test_backend_health():
    """Test if backend is accessible"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print_step("Backend Health Check", "✅ PASSED")
            return True
        else:
            print_step("Backend Health Check", f"❌ FAILED - Status {response.status_code}")
            return False
    except Exception as e:
        print_step("Backend Health Check", f"❌ FAILED - {e}")
        return False

def test_registration():
    """Test user registration"""
    try:
        payload = {
            "email": "diagnostic@tradepulse.com",
            "password": "test123456"
        }
        response = requests.post("http://localhost:8000/auth/register", 
                               json=payload, timeout=5)
        
        if response.status_code == 200:
            print_step("User Registration", "✅ PASSED")
            return True
        elif response.status_code == 400:
            # User might already exist
            error_detail = response.json().get("detail", "")
            if "already registered" in error_detail.lower():
                print_step("User Registration", "✅ PASSED (User exists)")
                return True
            else:
                print_step("User Registration", f"❌ FAILED - {error_detail}")
                return False
        else:
            print_step("User Registration", f"❌ FAILED - Status {response.status_code}")
            print(f"    Response: {response.text}")
            return False
    except Exception as e:
        print_step("User Registration", f"❌ FAILED - {e}")
        return False

def test_login():
    """Test user login and get token"""
    try:
        form_data = {
            "username": "diagnostic@tradepulse.com",
            "password": "test123456"
        }
        response = requests.post("http://localhost:8000/auth/login", 
                               data=form_data, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print_step("User Login", "✅ PASSED")
                print(f"    Token length: {len(token)} characters")
                print(f"    Token starts with: {token[:20]}...")
                return token
            else:
                print_step("User Login", "❌ FAILED - No token in response")
                return None
        else:
            print_step("User Login", f"❌ FAILED - Status {response.status_code}")
            print(f"    Response: {response.text}")
            return None
    except Exception as e:
        print_step("User Login", f"❌ FAILED - {e}")
        return None

def test_protected_endpoint(token):
    """Test protected endpoint with token"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8000/social/competitions/my", 
                              headers=headers, timeout=5)
        
        if response.status_code == 200:
            print_step("Protected Endpoint Test", "✅ PASSED")
            return True
        else:
            print_step("Protected Endpoint Test", f"❌ FAILED - Status {response.status_code}")
            print(f"    Response: {response.text}")
            return False
    except Exception as e:
        print_step("Protected Endpoint Test", f"❌ FAILED - {e}")
        return False

def test_competition_creation(token):
    """Test competition creation endpoint"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "name": "Diagnostic Test Competition",
            "description": "Testing competition creation",
            "duration_days": 1,
            "max_participants": 5,
            "starting_balance": 10000,
            "rules": "Test rules"
        }
        response = requests.post("http://localhost:8000/social/competitions", 
                               json=payload, headers=headers, timeout=5)
        
        if response.status_code == 200:
            print_step("Competition Creation", "✅ PASSED")
            return True
        else:
            print_step("Competition Creation", f"❌ FAILED - Status {response.status_code}")
            print(f"    Response: {response.text}")
            
            # Check for specific error
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    print(f"    Error detail: {error_data.get('detail', 'No detail')}")
                except:
                    pass
            return False
    except Exception as e:
        print_step("Competition Creation", f"❌ FAILED - {e}")
        return False

def main():
    print("=" * 60)
    print("    TRADEPULSE AUTHENTICATION DIAGNOSTIC")
    print("=" * 60)
    print()
    
    # Test sequence
    tests_passed = 0
    total_tests = 5
    
    # 1. Backend health
    if test_backend_health():
        tests_passed += 1
    else:
        print("\n❌ CRITICAL: Backend is not running!")
        print("   Solution: Run Launch_tradepulse.bat option 1 first")
        return
    
    # 2. Registration
    if test_registration():
        tests_passed += 1
    
    # 3. Login
    token = test_login()
    if token:
        tests_passed += 1
    else:
        print("\n❌ CRITICAL: Login failed - cannot proceed!")
        return
    
    # 4. Protected endpoint
    if test_protected_endpoint(token):
        tests_passed += 1
    
    # 5. Competition creation
    if test_competition_creation(token):
        tests_passed += 1
    
    # Results
    print("\n" + "=" * 60)
    print(f"    DIAGNOSTIC RESULTS: {tests_passed}/{total_tests} PASSED")
    print("=" * 60)
    
    if tests_passed == total_tests:
        print("🎉 ALL TESTS PASSED! Authentication should work in frontend.")
        print("\nNext steps:")
        print("1. Clear browser cache completely")
        print("2. Use incognito mode")
        print("3. Try creating competition again")
    else:
        print("🔧 ISSUES FOUND! Check the failed tests above.")
        print("\nCommon solutions:")
        print("1. Restart backend: Launch_tradepulse.bat option 1")
        print("2. Check backend/.env has SECRET_KEY")
        print("3. Clear browser storage completely")

if __name__ == "__main__":
    main()
