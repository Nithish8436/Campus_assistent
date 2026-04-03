from typing import List
from pydantic import BaseModel, Field


class QuizRequest(BaseModel):
    file_ids: List[str]
    difficulty: str = Field(pattern="^(easy|medium|hard)$")
    count: int = Field(ge=1, le=30)


class QuizOption(BaseModel):
    label: str   # "A", "B", "C", "D"
    text: str


class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]
    answer: str   # e.g. "A"
    explanation: str


class QuizResponse(BaseModel):
    questions: List[QuizQuestion]
