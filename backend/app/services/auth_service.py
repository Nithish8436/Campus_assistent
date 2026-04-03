from fastapi import Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_service import get_supabase_client

security = HTTPBearer(auto_error=False)

async def get_current_user(auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifies the Supabase JWT and returns the user object.
    Returns None if no token is provided OR if the token is invalid (guest mode).

    IMPORTANT: We never raise HTTPException here. If we did, FastAPI would handle
    the exception BEFORE the CORSMiddleware can add the Access-Control-Allow-Origin
    header, causing a misleading CORS error in the browser console.
    """
    if not auth:
        return None

    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(auth.credentials)

        if not user_response or not user_response.user:
            return None

        return user_response.user
    except Exception as e:
        # Invalid/expired token → treat as guest, never raise
        print(f"Auth verification error (falling back to guest): {e}")
        return None
