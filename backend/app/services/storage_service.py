from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


UPLOAD_DIR = Path("uploads")


def save_upload_file(upload_file: UploadFile) -> tuple[str, str, int]:
    """Persist uploaded file to local uploads directory and return metadata."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    file_ext = Path(upload_file.filename or "").suffix
    stored_name = f"{uuid4().hex}{file_ext}"
    stored_path = UPLOAD_DIR / stored_name

    data = upload_file.file.read()
    stored_path.write_bytes(data)

    return stored_name, str(stored_path), len(data)
