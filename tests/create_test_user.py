#!/usr/bin/env python3
"""
Create a test user for testing competition joining
"""
import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000"

async def create_test_user():
    """Create a test user account"""
    async with aiohttp.ClientSession() as session:
        
        # Create user account
        register_data = {
            "email": "testuser@tradepulse.com",
            "password": "password123",
            "full_name": "Test User"
        }
        
        print("📝 Creating test user...")
        async with session.post(f"{BASE_URL}/auth/register", json=register_data) as response:
            response_text = await response.text()
            print(f"Registration Status: {response.status}")
            print(f"Response: {response_text}")
            
            if response.status in [200, 201]:
                print("✅ User created successfully")
            elif "already registered" in response_text.lower():
                print("ℹ️  User already exists, that's fine")
            else:
                print("❌ Failed to create user")
                return False
        
        # Test login
        print("\n🔐 Testing login...")
        login_data = {
            "username": "testuser@tradepulse.com",
            "password": "password123"
        }
        
        async with session.post(f"{BASE_URL}/auth/login", data=login_data) as response:
            if response.status == 200:
                result = await response.json()
                print(f"✅ Login successful, token: {result['access_token'][:20]}...")
                return result["access_token"]
            else:
                text = await response.text()
                print(f"❌ Login failed: {response.status} - {text}")
                return False

if __name__ == "__main__":
    asyncio.run(create_test_user())
