from typing import Optional
from pydantic import BaseModel, Field

class DocumentMetadata(BaseModel):
    document_id: str
    document_name: str
    file_type: str
    chunks: int
    file_path: Optional[str] = None
    upload_time: str
    status: str = "indexed"

class ChunkMetadata(BaseModel):
    document_id: str
    document_name: str
    chunk_id: str
    file_type: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    upload_time: str

class UploadResponse(BaseModel):
    success: bool
    document_name: str
    document_id: str
    chunks_created: int
    message: str
