from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from backend.database.database import get_all_documents, delete_document_from_db, get_document_by_id, get_db_stats
from backend.vectorstore.chroma_service import get_chroma_service

router = APIRouter()

@router.get("/documents")
async def list_documents() -> List[Dict[str, Any]]:
    """Return all indexed documents with their chunk counts and metadata."""
    docs = get_all_documents()
    return docs

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its chunks from both ChromaDB and SQLite."""
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from ChromaDB
    chroma_service = get_chroma_service()
    chroma_service.delete_document_chunks(document_id)

    # Remove from SQLite
    delete_document_from_db(document_id)

    return {"success": True, "message": f"Document '{doc['document_name']}' deleted successfully"}

@router.get("/stats")
async def get_system_stats() -> Dict[str, Any]:
    """Return overall knowledge base statistics for dashboard cards."""
    db_stats = get_db_stats()
    chroma_service = get_chroma_service()
    vector_stats = chroma_service.get_stats()

    return {
        "total_documents": db_stats["total_documents"],
        "total_chunks": vector_stats["total_chunks"],
        "collection_name": vector_stats["collection_name"],
        "vector_store": "ChromaDB (Persistent)",
        "status": "online"
    }
