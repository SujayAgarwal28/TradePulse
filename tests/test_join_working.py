#!/usr/bin/env python3
"""
QUICK JOIN TEST - Verify competition joining actually works
"""
import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000"

async def test_join_directly():
    """Test the join endpoint directly with proper authentication"""
    async with aiohttp.ClientSession() as session:
        
        # First, login to get token
        login_data = {
            "username": "testuser@tradepulse.com",  # Use the newly created test account
            "password": "password123"
        }
        
        print("🔐 Logging in...")
        async with session.post(f"{BASE_URL}/auth/login", data=login_data) as response:
            if response.status != 200:
                print(f"❌ Login failed: {response.status}")
                text = await response.text()
                print(f"Response: {text}")
                return
            
            result = await response.json()
            token = result["access_token"]
            print(f"✅ Login successful, got token")
        
        # Set auth headers
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get available competitions first
        print("\n📋 Getting available competitions...")
        async with session.get(f"{BASE_URL}/social/competitions", headers=headers) as response:
            if response.status != 200:
                print(f"❌ Failed to get competitions: {response.status}")
                return
            
            competitions = await response.json()
            if not competitions["competitions"]:
                print("❌ No competitions available")
                return
            
            comp = competitions["competitions"][0]
            comp_id = comp["id"]
            comp_name = comp["name"]
            print(f"✅ Found competition: {comp_name} (ID: {comp_id})")
        
        # Try to join the competition
        print(f"\n🎯 Attempting to join competition {comp_id}...")
        async with session.post(f"{BASE_URL}/social/competitions/{comp_id}/join", headers=headers) as response:
            response_text = await response.text()
            print(f"📡 Status: {response.status}")
            print(f"📄 Response: {response_text}")
            
            if response.status == 200:
                result = await response.json()
                print(f"✅ SUCCESS: {result.get('message', 'Joined successfully')}")
            else:
                print(f"❌ FAILED: HTTP {response.status}")
                try:
                    error_data = json.loads(response_text)
                    print(f"Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"Raw error: {response_text}")

if __name__ == "__main__":
    asyncio.run(test_join_directly())
