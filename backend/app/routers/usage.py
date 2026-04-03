from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from app.services.auth_service import get_current_user
from app.services.supabase_service import get_supabase_client
from app.services.usage_service import guest_usage, GUEST_LIMIT, MEMBER_LIMIT

router = APIRouter()


@router.get("")
@router.get("/")
async def get_usage(request: Request, user=Depends(get_current_user)):
    """
    Returns the current user's usage count and limit.
    Members: reads from usage_tracking table.
    Guests:  reads from in-memory IP-based tracker.
    """
    if user:
        # Member: fetch from DB
        try:
            supabase = get_supabase_client()
            res = (
                supabase.table("usage_tracking")
                .select("actions_count")
                .eq("user_id", user.id)
                .execute()
            )
            count = res.data[0]["actions_count"] if res.data else 0
        except Exception as e:
            print(f"WARNING: Could not fetch member usage: {e}")
            count = 0

        return {
            "role": "member",
            "used": count,
            "limit": MEMBER_LIMIT,
            "percent": round((count / MEMBER_LIMIT) * 100, 1),
        }
    else:
        # Guest: read from in-memory tracker
        client_ip = request.client.host if request.client else "unknown"
        count = guest_usage.get(client_ip, 0)
        return {
            "role": "guest",
            "used": count,
            "limit": GUEST_LIMIT,
            "percent": round((count / GUEST_LIMIT) * 100, 1),
        }
