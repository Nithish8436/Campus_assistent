from fastapi import APIRouter, HTTPException, Depends, Request
from app.models.summarize import SummarizeRequest, SummarizeResponse
from app.services.supabase_service import get_supabase_client
from app.services.groq_service import generate_completion, BUSY_MESSAGE, OVERLOAD_MESSAGE, GENERIC_ERROR_MESSAGE
from app.services.auth_service import get_current_user
from app.services.usage_service import check_usage_limit
from groq import RateLimitError, APIStatusError

router = APIRouter()


@router.post("", response_model=SummarizeResponse)
async def summarize(
    request: SummarizeRequest, 
    fastapi_req: Request,
    user=Depends(get_current_user)
):
    """Summarize a document by fetching all its chunks and calling Groq."""
    # Enforce Usage Limits
    await check_usage_limit(fastapi_req, user)
    try:
        supabase = get_supabase_client()

        # Fetch all chunks for the given file
        result = supabase.table("chunks").select("content").eq("file_id", request.file_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="No content found for this file. Please re-upload the document.")

        full_text = "\n\n".join(c["content"] for c in result.data)

        mode_instructions = {
            "detailed": "Write a comprehensive, detailed summary covering all key topics, concepts, and important details.",
            "bullets": "Write a bullet-point summary. Use clear, concise bullet points (•) organised by topic.",
            "simple": "Write a short, simple summary in plain language. Keep it to 3-5 sentences suitable for a beginner.",
            "exam": "Write an exam-focused summary. Highlight key definitions, important facts, formulas, and concepts likely to appear in exams.",
        }

        instruction = mode_instructions.get(request.mode, mode_instructions["detailed"])

        prompt = (
            f"You are an expert study assistant. Summarise the following document content.\n\n"
            f"Instruction: {instruction}\n\n"
            f"Document content:\n{full_text[:12000]}\n\n"
            f"Summary:"
        )

        summary_text = generate_completion(prompt)
        return SummarizeResponse(summary=summary_text)

    except HTTPException:
        raise
    except RateLimitError:
        print("WARNING: Groq rate limit hit in summarize.")
        return SummarizeResponse(summary=BUSY_MESSAGE)
    except APIStatusError as e:
        print(f"WARNING: Groq API error {e.status_code} in summarize.")
        msg = OVERLOAD_MESSAGE if e.status_code in (503, 529) else GENERIC_ERROR_MESSAGE
        return SummarizeResponse(summary=msg)
    except Exception as e:
        print(f"ERROR: Summarization failed: {e}")
        return SummarizeResponse(summary=GENERIC_ERROR_MESSAGE)

