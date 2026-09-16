import os
import logging
from typing import List, Dict, Any, Optional
from backend.config import settings

logger = logging.getLogger(__name__)

class ChromaService:
    """
    Manages persistent ChromaDB vector store for document knowledge chunks.
    Uses cosine distance space for normalized semantic embeddings.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChromaService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        import chromadb
        from chromadb.config import Settings as ChromaSettings
        os.makedirs(settings.CHROMA_PATH, exist_ok=True)
        logger.info(f"Initializing persistent ChromaDB client at: {settings.CHROMA_PATH}")
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PATH,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        # Cosine distance space: distance = 1 - cosine_similarity
        self.collection = self.client.get_or_create_collection(
            name=settings.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"ChromaDB collection '{settings.COLLECTION_NAME}' loaded with {self.collection.count()} chunks.")

    def add_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> int:
        """
        Add document chunks and their precomputed embeddings with metadata to ChromaDB.
        """
        if not chunks:
            return 0

        ids = [c["id"] for c in chunks]
        documents = [c["content"] for c in chunks]
        
        # Sanitize metadata for ChromaDB (no None values permitted in some versions)
        metadatas = []
        for c in chunks:
            meta = {
                "document_id": str(c.get("document_id", "")),
                "document_name": str(c.get("document_name", "")),
                "chunk_id": str(c.get("chunk_id", "")),
                "file_type": str(c.get("file_type", "")),
                "page_number": int(c.get("page_number")) if c.get("page_number") is not None else -1,
                "section": str(c.get("section") or ""),
                "upload_time": str(c.get("upload_time", ""))
            }
            metadatas.append(meta)

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Upserted {len(chunks)} chunks into ChromaDB collection '{settings.COLLECTION_NAME}'.")
        return len(chunks)

    def query_chunks(
        self,
        query_embedding: List[float],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search against indexed knowledge chunks.
        Returns retrieved chunks formatted with relevance score and metadata.
        """
        count = self.collection.count()
        if count == 0:
            return []

        n_results = min(top_k, count)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )

        retrieved: List[Dict[str, Any]] = []
        if not results or not results["ids"] or not results["ids"][0]:
            return retrieved

        ids = results["ids"][0]
        docs = results["documents"][0] if "documents" in results else []
        metas = results["metadatas"][0] if "metadatas" in results else []
        distances = results["distances"][0] if "distances" in results else []

        for i in range(len(ids)):
            meta = metas[i] if i < len(metas) else {}
            dist = distances[i] if i < len(distances) else 1.0
            
            # For cosine distance, distance is in [0, 2].
            # With normalized vectors: cosine_sim = 1 - distance
            # Convert to [0, 1] relevance score:
            relevance_score = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
            
            page_no = meta.get("page_number")
            section_val = meta.get("section")

            retrieved.append({
                "chunk_id": meta.get("chunk_id", f"chunk_{i+1:03d}"),
                "document_id": meta.get("document_id"),
                "document_name": meta.get("document_name", "Unknown"),
                "content": docs[i] if i < len(docs) else "",
                "relevance_score": round(relevance_score, 4),
                "distance": round(dist, 4),
                "page_number": None if page_no is None or page_no == -1 else page_no,
                "section": None if not section_val else section_val
            })

        # Sort by relevance_score descending
        retrieved.sort(key=lambda x: x["relevance_score"], reverse=True)
        return retrieved

    def delete_document_chunks(self, document_id: str) -> int:
        """Delete all chunks belonging to a document from ChromaDB."""
        try:
            self.collection.delete(where={"document_id": document_id})
            return 1
        except Exception as e:
            logger.warning(f"Error deleting chunks for doc {document_id}: {e}")
            return 0

    def get_stats(self) -> Dict[str, Any]:
        """Return total chunks and collection name."""
        return {
            "collection_name": settings.COLLECTION_NAME,
            "total_chunks": self.collection.count(),
            "storage_path": settings.CHROMA_PATH
        }

_chroma_service_instance = None

def get_chroma_service() -> ChromaService:
    global _chroma_service_instance
    if _chroma_service_instance is None:
        _chroma_service_instance = ChromaService()
    return _chroma_service_instance
