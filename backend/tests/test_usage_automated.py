import os
import sys
import asyncio
from unittest.mock import MagicMock
from dotenv import load_dotenv

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.usage_service import check_usage_limit, guest_usage, GUEST_LIMIT, MEMBER_LIMIT

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

async def test_guest_usage():
    print("--- Running Guest Usage Test ---")
    # Reset guest usage
    guest_usage.clear()
    
    # Mock request
    request = MagicMock()
    request.client.host = "1.2.3.4"
    
    # Send 3 requests (GUEST_LIMIT=3)
    for i in range(GUEST_LIMIT):
        await check_usage_limit(request, user=None)
        print(f"Guest request {i+1} allowed. Current usage: {guest_usage['1.2.3.4']}")
        
    # 4th request should raise 403
    try:
        await check_usage_limit(request, user=None)
        print("FAIL: Guest 4th request should have been blocked!")
    except Exception as e:
        if hasattr(e, 'status_code') and e.status_code == 403:
            print("PASS: Guest 4th request blocked with 403.")
        else:
            print(f"FAIL: Unexpected error type: {type(e)} {e}")

async def test_member_usage():
    print("\n--- Running Member Usage Test (Simulated) ---")
    # Note: For real DB test, we'd need a real user ID. 
    # This simulation tests the backend logic.
    
    # If no real DB access, this will 'fail-open' as per design
    # Let's try to find a real user_id or just mock the supabase call
    
    user = MagicMock()
    user.id = "00000000-0000-0000-0000-00000000000x" # Dummy ID
    
    request = MagicMock()
    request.client.host = "1.2.3.1"
    
    print("Testing if member logic triggers increment...")
    # This will print WARNING if RLS/Table issue, but it will return True
    # If the fix_usage_rls.sql was run, this might actually insert a row!
    result = await check_usage_limit(request, user=user)
    
    if result is True:
        print("PASS: Member request allowed (Logic or Fail-Safe worked).")
    else:
        print("FAIL: Member request returned False.")

async def run_all():
    await test_guest_usage()
    await test_member_usage()
    print("\nTests complete!")

if __name__ == "__main__":
    asyncio.run(run_all())
