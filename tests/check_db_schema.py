#!/usr/bin/env python3
"""
DATABASE SCHEMA CHECKER
=======================
Check the actual database schema to understand the table structure
"""

import sqlite3

def check_database_schema():
    try:
        conn = sqlite3.connect('tradepulse.db')
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("=== DATABASE TABLES ===")
        for table in tables:
            table_name = table[0]
            print(f"\nTable: {table_name}")
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            for col in columns:
                print(f"  {col[1]} ({col[2]}) - {'PRIMARY KEY' if col[5] else 'NOT NULL' if col[3] else 'NULL'}")
        
        # Try to check Competition table specifically
        print("\n=== COMPETITION TABLE DATA ===")
        try:
            cursor.execute("SELECT * FROM competition LIMIT 3;")
            competitions = cursor.fetchall()
            print(f"Found {len(competitions)} competitions in 'competition' table")
            
            if competitions:
                cursor.execute("PRAGMA table_info(competition);")
                columns = cursor.fetchall()
                col_names = [col[1] for col in columns]
                print(f"Columns: {col_names}")
                
                for comp in competitions[:2]:  # Show first 2
                    print(f"Competition: {comp}")
                    
        except Exception as e:
            print(f"Error checking competition table: {e}")
        
        # Check CompetitionParticipant table
        print("\n=== PARTICIPANTS TABLE ===")
        try:
            cursor.execute("SELECT * FROM competition_participant LIMIT 5;")
            participants = cursor.fetchall()
            print(f"Found {len(participants)} participants")
            
            if participants:
                for p in participants:
                    print(f"Participant: {p}")
                    
        except Exception as e:
            print(f"Error checking participants: {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    check_database_schema()
