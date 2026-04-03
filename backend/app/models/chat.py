from typing import List
from pydantic import BaseModel, Field
from app.models.common import ChatMessage


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    file_ids: List[str]
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
