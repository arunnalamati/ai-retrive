import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.config import settings
from backend.utils import generate_id, current_iso_timestamp
from backend.ingestion.document_loader import load_and_extract_document
from backend.chunking.text_chunker import chunk_document
from backend.embeddings.embedding_service import get_embedding_service
from backend.vectorstore.chroma_service import get_chroma_service
from backend.database.database import add_document
from backend.models.document_models import UploadResponse

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv"}

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "unknown_document.txt"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: PDF, DOCX, TXT, CSV"
        )

    document_id = generate_id("doc")
    save_filename = f"{document_id}_{filename}"
    save_path = os.path.join(settings.UPLOAD_DIR, save_filename)

    # 1. Save uploaded file to disk
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")
    finally:
        file.file.close()

    # 2. Extract and clean text
    try:
        raw_items = load_and_extract_document(save_path, filename)
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=422, detail=f"Failed to extract text: {str(e)}")

    if not raw_items:
        raise HTTPException(status_code=400, detail="The uploaded document contains no extractable text.")

    # 3. Chunk text
    upload_time = current_iso_timestamp()
    file_type = ext.lstrip(".")
    chunks = chunk_document(
        document_items=raw_items,
        document_name=filename,
        document_id=document_id,
        file_type=file_type,
        upload_time=upload_time
    )

    if not chunks:
        raise HTTPException(status_code=400, detail="Document could not be segmented into valid chunks.")

    # 4. Generate embeddings
    embedding_service = get_embedding_service()
    chunk_texts = [c["content"] for c in chunks]
    embeddings = embedding_service.generate_embeddings(chunk_texts)

    # 5. Store in ChromaDB
    chroma_service = get_chroma_service()
    chroma_service.add_chunks(chunks, embeddings)

    # 6. Save metadata to SQLite
    add_document(
        document_id=document_id,
        document_name=filename,
        file_type=file_type,
        chunks=len(chunks),
        file_path=save_path
    )

    return UploadResponse(
        success=True,
        document_name=filename,
        document_id=document_id,
        chunks_created=len(chunks),
        message="Document indexed successfully"
    )
