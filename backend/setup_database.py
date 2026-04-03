"""
Database setup script for Smart Campus Assistant.
Run this to create all tables and functions in Supabase.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Read SQL files
with open("schema.sql", "r", encoding="utf-8") as f:
    schema_sql = f.read()

with open("match_chunks_function.sql", "r", encoding="utf-8") as f:
    function_sql = f.read()

# Initialize Supabase client
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    exit(1)

print(f"Connecting to Supabase: {url}")
supabase = create_client(url, key)

print("\n" + "="*60)
print("IMPORTANT: SQL DDL cannot be run via Supabase Python client.")
print("Please run the SQL manually in Supabase Dashboard:")
print("="*60)
print("\n1. Go to: https://sitkpsxbgxgliacwgrto.supabase.co")
print("2. Click 'SQL Editor' in the left sidebar")
print("3. Click 'New query'")
print("\n--- STEP 1: Create Tables ---")
print("4. Paste the contents from: backend/schema.sql")
print("5. Click 'Run' ▶️")
print("\n--- STEP 2: Create Search Function ---")
print("6. Create another new query")
print("7. Paste the contents from: backend/match_chunks_function.sql")
print("8. Click 'Run' ▶️")
print("\n" + "="*60)
print("\nAfter running both queries, your database is ready!")
print("Test by uploading a file at http://localhost:5174")
print("="*60)
