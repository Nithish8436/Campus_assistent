from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from app.models.chat import ChatRequest
from app.services.embedding_service import embed_text
from app.services.supabase_service import get_supabase_client
from app.services.groq_service import generate_streaming
from app.services.auth_service import get_current_user
from app.services.usage_service import check_usage_limit

router = APIRouter()


@router.post("")
@router.post("/")
async def chat(
    request: ChatRequest,
    fastapi_req: Request,
    user=Depends(get_current_user)
):
    """Answer questions using RAG: retrieve relevant chunks, fall back to keyword search."""

    # Enforce Usage Limits (raises 403 HTTPException only for limit-reached)
    await check_usage_limit(fastapi_req, user)

    supabase = get_supabase_client()

    # ── Step 1: Try vector similarity search ─────────────────────────────────
    try:
        question_embedding = embed_text(request.question)
        vector_result = supabase.rpc(
            "match_chunks",
            {
                "query_embedding": question_embedding,
                "match_count": 5,
                "file_ids": request.file_ids
            }
        ).execute()
        chunks = vector_result.data or []
    except Exception as e:
        print(f"WARNING: Vector search failed, falling back: {e}")
        chunks = []

    # ── Step 2: Keyword search fallback ──────────────────────────────────────
    if not chunks:
        try:
            keywords = [w for w in request.question.split() if len(w) > 3]
            keyword = keywords[0] if keywords else request.question[:20]
            query = supabase.table("chunks").select("content, file_id")
            if request.file_ids:
                query = query.in_("file_id", request.file_ids)
            fallback_result = query.ilike("content", f"%{keyword}%").limit(5).execute()
            chunks = fallback_result.data or []
        except Exception as e:
            print(f"WARNING: Keyword search failed: {e}")
            chunks = []

    # ── Step 3: Fetch first N chunks if still nothing ────────────────────────
    if not chunks:
        try:
            query = supabase.table("chunks").select("content, file_id")
            if request.file_ids:
                query = query.in_("file_id", request.file_ids)
            fallback_result = query.limit(5).execute()
            chunks = fallback_result.data or []
        except Exception as e:
            print(f"WARNING: Final chunk fallback failed: {e}")
            chunks = []

    # ── Step 4: Build prompt ─────────────────────────────────────────────────
    SYSTEM_INSTRUCTION = (
        "You are a focused academic study assistant for the Smart Campus Assistant platform. "
        "Your ONLY job is to help students understand their uploaded study materials.\n\n"
        "STRICT RULES YOU MUST FOLLOW:\n"
        "1. ONLY answer questions that are directly related to the content in the provided document context below.\n"
        "2. If the user asks anything unrelated to the documents or to academic study (e.g., general chat, jokes, coding help unrelated to the material, personal advice), "
        "politely decline and remind them to ask about their uploaded documents.\n"
        "3. Never make up information not present in the context.\n"
        "4. Keep your answers clear, structured, and grounded in the source material.\n"
        "5. If the context doesn't contain enough information to answer, say so honestly."
    )

    if chunks:
        context = "\n\n".join(
            f"[Source {i+1}]: {c['content']}" for i, c in enumerate(chunks)
        )
        prompt = (
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"--- DOCUMENT CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
            f"Student's Question: {request.question}\n\n"
            f"Answer (based strictly on the context above):"
        )
    else:
        prompt = (
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"No document context is available. "
            f"The student asked: \"{request.question}\".\n\n"
            f"Inform them politely that no documents have been uploaded or selected yet, "
            f"and guide them to upload study materials in the Library section first."
        )

    # ── Step 5: Stream SSE response ──────────────────────────────────────────
    async def stream_response():
        try:
            for chunk_text in generate_streaming(prompt):
                yield {"data": chunk_text}
        except Exception as e:
            print(f"ERROR: Groq streaming failed: {e}")
            yield {"data": f"[ERROR] {str(e)}"}
        yield {"data": "[DONE]"}

    return EventSourceResponse(stream_response())
