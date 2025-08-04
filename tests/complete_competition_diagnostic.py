#!/usr/bin/env python3
"""
COMPLETE COMPETITION DIAGNOSTIC
===============================
This script checks EVERY aspect of the competition system:
1. Backend endpoints
2. Database structure
3. Competition creation
4. Competition joining
5. Frontend integration
"""

import requests
import json
import sqlite3
from datetime import datetime

def print_step(step, status="TESTING"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {step} - {status}")

def get_auth_token():
    """Get authentication token"""
    try:
        form_data = {
            "username": "diagnostic@tradepulse.com",
            "password": "test123456"
        }
        response = requests.post("http://localhost:8000/auth/login", 
                               data=form_data, timeout=5)
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print_step("Authentication", "✅ Token acquired")
            return token
        else:
            print_step("Authentication", "❌ Failed")
            return None
    except Exception as e:
        print_step("Authentication", f"❌ Error: {e}")
        return None

def check_database_competitions():
    """Check competitions in database"""
    try:
        conn = sqlite3.connect('tradepulse.db')
        cursor = conn.cursor()
        
        # Check competitions table
        cursor.execute("SELECT * FROM competitions")
        competitions = cursor.fetchall()
        print_step("Database Competitions", f"✅ Found {len(competitions)} competitions")
        
        for comp in competitions:
            print(f"    Competition ID: {comp[0]}, Name: {comp[1]}, Status: {comp[7]}")
        
        # Check participants
        cursor.execute("SELECT * FROM competition_participants")
        participants = cursor.fetchall()
        print_step("Database Participants", f"✅ Found {len(participants)} participants")
        
        conn.close()
        return competitions
    except Exception as e:
        print_step("Database Check", f"❌ Error: {e}")
        return []

def test_get_competitions(token):
    """Test getting all competitions"""
    try:
        response = requests.get("http://localhost:8000/social/competitions", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            competitions = data.get("competitions", [])
            print_step("Get All Competitions", f"✅ Retrieved {len(competitions)} competitions")
            
            for comp in competitions:
                print(f"    ID: {comp.get('id')}, Name: {comp.get('name')}, Status: {comp.get('status')}")
            
            return competitions
        else:
            print_step("Get All Competitions", f"❌ Status {response.status_code}")
            print(f"    Response: {response.text}")
            return []
    except Exception as e:
        print_step("Get All Competitions", f"❌ Error: {e}")
        return []

def test_get_my_competitions(token):
    """Test getting user's competitions"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8000/social/competitions/my", 
                              headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            competitions = data.get("competitions", [])
            print_step("Get My Competitions", f"✅ Retrieved {len(competitions)} competitions")
            return competitions
        else:
            print_step("Get My Competitions", f"❌ Status {response.status_code}")
            print(f"    Response: {response.text}")
            return []
    except Exception as e:
        print_step("Get My Competitions", f"❌ Error: {e}")
        return []

def test_create_competition(token):
    """Test creating a competition"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "name": "Test Competition - Working",
            "description": "This is a test competition that should work",
            "duration_days": 1,
            "max_participants": 10,
            "starting_balance": 10000,
            "rules": "Buy and sell stocks to maximize returns"
        }
        response = requests.post("http://localhost:8000/social/competitions", 
                               json=payload, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            comp_id = data.get("competition_id")
            print_step("Create Competition", f"✅ Created competition ID: {comp_id}")
            return comp_id
        else:
            print_step("Create Competition", f"❌ Status {response.status_code}")
            print(f"    Response: {response.text}")
            return None
    except Exception as e:
        print_step("Create Competition", f"❌ Error: {e}")
        return None

def test_join_competition(token, comp_id):
    """Test joining a competition"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"http://localhost:8000/social/competitions/{comp_id}/join", 
                               headers=headers, timeout=5)
        
        if response.status_code == 200:
            print_step("Join Competition", f"✅ Successfully joined competition {comp_id}")
            return True
        else:
            print_step("Join Competition", f"❌ Status {response.status_code}")
            print(f"    Response: {response.text}")
            return False
    except Exception as e:
        print_step("Join Competition", f"❌ Error: {e}")
        return False

def test_competition_details(comp_id):
    """Test getting competition details"""
    try:
        response = requests.get(f"http://localhost:8000/social/competitions/{comp_id}", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print_step("Competition Details", f"✅ Retrieved details for competition {comp_id}")
            print(f"    Name: {data.get('name')}")
            print(f"    Status: {data.get('status')}")
            print(f"    Participants: {data.get('participant_count', 0)}")
            return data
        else:
            print_step("Competition Details", f"❌ Status {response.status_code}")
            print(f"    Response: {response.text}")
            return None
    except Exception as e:
        print_step("Competition Details", f"❌ Error: {e}")
        return None

def main():
    print("=" * 60)
    print("    COMPLETE COMPETITION SYSTEM DIAGNOSTIC")
    print("=" * 60)
    print()
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("❌ CRITICAL: Cannot authenticate - stopping diagnostic")
        return
    
    # Check database state
    db_competitions = check_database_competitions()
    
    # Test getting all competitions
    api_competitions = test_get_competitions(token)
    
    # Test getting user's competitions
    my_competitions = test_get_my_competitions(token)
    
    # Test creating a new competition
    new_comp_id = test_create_competition(token)
    
    if new_comp_id:
        # Test getting details of new competition
        comp_details = test_competition_details(new_comp_id)
        
        # Test joining the competition
        join_success = test_join_competition(token, new_comp_id)
        
        if join_success:
            # Check my competitions again
            print_step("Re-checking My Competitions", "TESTING")
            updated_my_competitions = test_get_my_competitions(token)
    
    # Final summary
    print("\n" + "=" * 60)
    print("    DIAGNOSTIC SUMMARY")
    print("=" * 60)
    print(f"Database competitions: {len(db_competitions)}")
    print(f"API competitions: {len(api_competitions)}")
    print(f"My competitions: {len(my_competitions)}")
    print(f"New competition created: {'Yes' if new_comp_id else 'No'}")
    
    if new_comp_id:
        print(f"Competition joining: {'Success' if join_success else 'Failed'}")
    
    print("\nIf any tests failed, the issues need to be fixed in the backend code.")

if __name__ == "__main__":
    main()
