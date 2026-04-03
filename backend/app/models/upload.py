from pydantic import BaseModel


class UploadedFileItem(BaseModel):
    id: str | None = None
    original_name: str
    stored_name: str
    stored_path: str
    size_bytes: int
    page_count: int | None = None
    chunk_count: int | None = None


class UploadResponse(BaseModel):
    message: str
    files: list[UploadedFileItem]


class FileListResponse(BaseModel):
    files: list[UploadedFileItem]
