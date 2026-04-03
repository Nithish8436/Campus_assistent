from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.models.upload import UploadedFileItem, UploadResponse, FileListResponse
from app.services.storage_service import save_upload_file
from app.services.document_service import extract_text, chunk_text
from app.services.embedding_service import embed_batch
from app.services.supabase_service import get_supabase_client
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("/files", response_model=FileListResponse)
def list_files(user=Depends(get_current_user)):
    """
    Returns only the files that belong to the current user.
    Guests (no token) see only guest-uploaded files (user_id IS NULL).
    Authenticated users see only their own files.
    """
    try:
        supabase = get_supabase_client()

        query = supabase.table("files").select("*").order("uploaded_at", desc=True)

        if user:
            # Authenticated: filter by their user_id
            query = query.eq("user_id", user.id)
        else:
            # Guest: show only files with no owner (uploaded by this guest session)
            # Since we cannot identify guests across requests, return empty for safety.
            # Guests are nudged to sign up to persist their library.
            return FileListResponse(files=[])

        result = query.execute()

        files = [
            UploadedFileItem(
                id=f["id"],
                original_name=f["original_name"],
                stored_name=f["stored_name"],
                stored_path=f["stored_path"],
                size_bytes=f["file_size"],
                page_count=f.get("page_count"),
                chunk_count=None,
            )
            for f in result.data
        ]
        return FileListResponse(files=files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch files: {str(e)}")


@router.post("", response_model=UploadResponse)
@router.post("/", response_model=UploadResponse)
def upload_files(
    files: List[UploadFile] = File(...),
    user=Depends(get_current_user),
):
    """
    Upload and process files. Associates each file with the current user's ID.
    Guests can upload but files won't be persisted to their profile.
    """
    uploaded_items: List[UploadedFileItem] = []
    supabase = get_supabase_client()
    owner_id = user.id if user else None

    for item in files:
        try:
            # Save file to local storage
            stored_name, stored_path, size = save_upload_file(item)

            # Extract text and page count
            text, page_count = extract_text(stored_path)

            # Insert file record with user ownership
            file_record = supabase.table("files").insert({
                "user_id": owner_id,
                "original_name": item.filename or "unknown",
                "stored_name": stored_name,
                "stored_path": stored_path,
                "file_size": size,
                "page_count": page_count,
            }).execute()

            file_id = file_record.data[0]["id"]

            # Chunk text and generate embeddings
            chunks = chunk_text(text)
            embeddings = embed_batch(chunks)

            # Insert chunks with embeddings
            chunk_records = [
                {
                    "file_id": file_id,
                    "chunk_index": idx,
                    "content": chunk_content,
                    "embedding": embedding,
                }
                for idx, (chunk_content, embedding) in enumerate(zip(chunks, embeddings))
            ]
            if chunk_records:
                supabase.table("chunks").insert(chunk_records).execute()

            uploaded_items.append(
                UploadedFileItem(
                    id=file_id,
                    original_name=item.filename or "unknown",
                    stored_name=stored_name,
                    stored_path=stored_path,
                    size_bytes=size,
                    page_count=page_count,
                    chunk_count=len(chunks),
                )
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to process {item.filename}: {str(e)}"
            )

    return UploadResponse(
        message="Files uploaded and processed successfully", files=uploaded_items
    )
