import json
import re
from fastapi import APIRouter, HTTPException, Depends, Request
from app.models.quiz import QuizRequest, QuizResponse, QuizQuestion, QuizOption
from app.services.supabase_service import get_supabase_client
from app.services.groq_service import get_groq_client, BUSY_MESSAGE, OVERLOAD_MESSAGE, GENERIC_ERROR_MESSAGE
from app.services.auth_service import get_current_user
from app.services.usage_service import check_usage_limit
from groq import RateLimitError, APIStatusError

router = APIRouter()


def _extract_json_array(text: str) -> list:
    """Robustly extract a JSON array from LLM output that may contain narrative text."""
    text = text.strip()

    # Strategy 1: Strip markdown code fences
    if "```" in text:
        # Get content between first ``` and last ```
        parts = text.split("```")
        for part in parts:
            candidate = part.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            if candidate.startswith("["):
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    pass

    # Strategy 2: Direct parse if it starts with [
    if text.startswith("["):
        return json.loads(text)

    # Strategy 3: Regex to find first JSON array [...] in the text
    match = re.search(r'(\[.*\])', text, re.DOTALL)
    if match:
        return json.loads(match.group(1))

    raise ValueError(f"No valid JSON array found in LLM response. Response starts with: {text[:200]}")


@router.post("", response_model=QuizResponse)
async def quiz(
    request: QuizRequest,
    fastapi_req: Request,
    user=Depends(get_current_user)
):
    """Generate multiple-choice quiz questions from uploaded document chunks."""
    # Enforce Usage Limits
    await check_usage_limit(fastapi_req, user)
    try:
        supabase = get_supabase_client()

        # Fetch chunks for the selected files
        query = supabase.table("chunks").select("content")
        if request.file_ids:
            query = query.in_("file_id", request.file_ids)
        result = query.limit(20).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="No content found for selected files. Please upload documents first.")

        full_text = "\n\n".join(c["content"] for c in result.data)

        difficulty_guidance = {
            "easy": "simple recall questions with obvious answers",
            "medium": "questions requiring understanding and application of concepts",
            "hard": "challenging analytical questions requiring deep understanding",
        }
        guidance = difficulty_guidance.get(request.difficulty, "moderate difficulty questions")

        system_prompt = """You are a quiz generation API. You MUST respond with ONLY a valid JSON array.
Do NOT include any explanation, headers, markdown, or extra text.
Your entire response must start with [ and end with ]."""

        user_prompt = f"""Generate exactly {request.count} multiple-choice questions at {request.difficulty} difficulty ({guidance}).

Document content:
{full_text[:8000]}

JSON format (return ONLY this array):
[
  {{
    "question": "Question text here?",
    "options": [
      {{"label": "A", "text": "First option"}},
      {{"label": "B", "text": "Second option"}},
      {{"label": "C", "text": "Third option"}},
      {{"label": "D", "text": "Fourth option"}}
    ],
    "answer": "A",
    "explanation": "Brief explanation why A is correct."
  }}
]"""

        client = get_groq_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=4096,
        )
        raw = response.choices[0].message.content or ""

        questions_data = _extract_json_array(raw)

        questions = [
            QuizQuestion(
                question=q["question"],
                options=[QuizOption(label=o["label"], text=o["text"]) for o in q["options"]],
                answer=q["answer"],
                explanation=q.get("explanation", "")
            )
            for q in questions_data
        ]

        return QuizResponse(questions=questions)

    except HTTPException:
        raise
    except RateLimitError:
        print("WARNING: Groq rate limit hit in quiz.")
        raise HTTPException(status_code=503, detail=BUSY_MESSAGE)
    except APIStatusError as e:
        print(f"WARNING: Groq API error {e.status_code} in quiz.")
        msg = OVERLOAD_MESSAGE if e.status_code in (503, 529) else GENERIC_ERROR_MESSAGE
        raise HTTPException(status_code=503, detail=msg)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"WARNING: Failed to parse quiz JSON: {e}")
        raise HTTPException(
            status_code=500,
            detail="The assistant had trouble generating your quiz in the right format. Please try again."
        )
    except Exception as e:
        print(f"ERROR: Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_ERROR_MESSAGE)

