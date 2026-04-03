from fastapi import HTTPException, Request
from app.services.supabase_service import get_supabase_client

# In-memory guest tracking (IP-based)
# For production, use Redis for persistence across restarts.
guest_usage: dict = {}
GUEST_LIMIT = 3
MEMBER_LIMIT = 50


async def check_usage_limit(request: Request, user=None):
    """
    Enforces usage limits based on auth status.
    Guests:  3 actions (IP-based, in-memory)
    Members: 50 actions (Supabase table-based)

    IMPORTANT: This function NEVER raises on database errors.
    If the DB is unavailable or RLS blocks access, we fail-open
    and allow the request. This prevents a DB misconfiguration
    from causing a CORS-masked 500 error in the browser.
    """

    # ── 1. MEMBER LOGIC ───────────────────────────────────────────────────────
    if user:
        user_id = user.id
        try:
            supabase = get_supabase_client()

            # Fetch current count
            res = (
                supabase.table("usage_tracking")
                .select("actions_count")
                .eq("user_id", user_id)
                .execute()
            )

            if not res.data:
                # First-time user — create record
                print(f"DEBUG: Creating first-time usage record for user {user_id}")
                supabase.table("usage_tracking").insert(
                    {"user_id": user_id, "actions_count": 1}
                ).execute()
                return True

            count = res.data[0]["actions_count"]
            print(f"DEBUG: Current actions_count for user {user_id} is {count}")

            if count >= MEMBER_LIMIT:
                print(f"DEBUG: Member limit reached for user {user_id} ({count}/{MEMBER_LIMIT})")
                raise HTTPException(
                    status_code=403,
                    detail={
                        "code": "LIMIT_REACHED",
                        "message": f"Monthly member limit reached ({MEMBER_LIMIT}/{MEMBER_LIMIT}). Upgrade coming soon!",
                    },
                )

            # Increment usage
            print(f"DEBUG: Incrementing actions_count for user {user_id} to {count + 1}")
            supabase.table("usage_tracking").update(
                {"actions_count": count + 1, "updated_at": "now()"}
            ).eq("user_id", user_id).execute()
            return True

        except HTTPException:
            # Re-raise real limit-enforcement 403s
            raise
        except Exception as e:
            # ANY other DB error (RLS, table missing, network) → fail-open
            print(f"WARNING: usage_tracking DB error (allowing request): {e}")
            return True


    # ── 2. GUEST LOGIC ────────────────────────────────────────────────────────
    client_ip = request.client.host if request.client else "unknown"
    current_count = guest_usage.get(client_ip, 0)

    if current_count >= GUEST_LIMIT:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "GUEST_LIMIT_REACHED",
                "message": f"Guest limit reached ({GUEST_LIMIT}/{GUEST_LIMIT}). Sign up to get 50 free actions!",
            },
        )

    guest_usage[client_ip] = current_count + 1
    return True
