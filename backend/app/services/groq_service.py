import os
from groq import Groq, RateLimitError, APIStatusError

_client: Groq | None = None

# Friendly messages — no mention of AI, rate limits, or external services
BUSY_MESSAGE = (
    "I'm having a bit of difficulty processing your request right now. "
    "This sometimes happens during peak study hours. "
    "Please try again in a few moments — your question is a great one!"
)

OVERLOAD_MESSAGE = (
    "The assistant is currently taking a short breather. "
    "We've been working hard analyzing lots of documents today! "
    "Please wait a moment and try your question again."
)

GENERIC_ERROR_MESSAGE = (
    "Something went wrong while preparing your answer. "
    "Please try rephrasing your question or try again shortly."
)


def get_groq_client() -> Groq:
    """Initialize and return Groq client."""
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY must be set")
        _client = Groq(api_key=api_key)
    return _client


def generate_completion(prompt: str, model: str = "llama-3.3-70b-versatile") -> str:
    """Call Groq API and return the response text, with graceful error handling."""
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4096,
        )
        return response.choices[0].message.content
    except RateLimitError:
        print("WARNING: Groq rate limit reached (generate_completion).")
        return BUSY_MESSAGE
    except APIStatusError as e:
        print(f"WARNING: Groq API error {e.status_code} (generate_completion): {e.message}")
        return OVERLOAD_MESSAGE if e.status_code in (503, 529) else GENERIC_ERROR_MESSAGE
    except Exception as e:
        print(f"WARNING: Unexpected groq error (generate_completion): {e}")
        return GENERIC_ERROR_MESSAGE


def generate_streaming(prompt: str, model: str = "llama-3.3-70b-versatile"):
    """
    Stream Groq response chunks. On any error, yields a single friendly
    sentence instead of leaking technical details to the user.
    """
    try:
        client = get_groq_client()
        stream = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4096,
            stream=True,
        )
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                yield text

    except RateLimitError:
        print("WARNING: Groq rate limit reached (generate_streaming).")
        yield BUSY_MESSAGE

    except APIStatusError as e:
        print(f"WARNING: Groq API error {e.status_code} (generate_streaming): {e.message}")
        if e.status_code in (503, 529):
            yield OVERLOAD_MESSAGE
        else:
            yield GENERIC_ERROR_MESSAGE

    except Exception as e:
        print(f"WARNING: Unexpected groq error (generate_streaming): {e}")
        yield GENERIC_ERROR_MESSAGE
