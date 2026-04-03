from pydantic import BaseModel, Field


class SummarizeRequest(BaseModel):
    file_id: str
    mode: str = Field(pattern="^(detailed|bullets|simple|exam)$")


class SummarizeResponse(BaseModel):
    summary: str
