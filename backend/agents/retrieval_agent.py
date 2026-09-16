from typing import List, Dict, Any
from backend.rag.retrieval import search_knowledge_base
from backend.config import settings

class RetrievalAgent:
    """
    Retrieval Agent:
    Performs semantic vector search across the ChromaDB knowledge store,
    evaluates relevance scores, ranks candidate chunks, and enforces the relevance threshold.
    """
    def __init__(self):
        self.agent_name = "Retrieval Agent"

    def retrieve(
        self,
        query: str,
        query_type: str = "factual",
        top_k: int = 3,
        threshold: float = None
    ) -> Dict[str, Any]:
        if threshold is None:
            threshold = settings.RETRIEVAL_THRESHOLD

        chunks, no_sufficient_info = search_knowledge_base(
            query=query,
            top_k=top_k,
            threshold=threshold
        )

        formatted_chunks = []
        for c in chunks:
            formatted_chunks.append({
                "document_name": c.get("document_name", "Unknown"),
                "chunk_id": c.get("chunk_id", ""),
                "content": c.get("content", ""),
                "relevance_score": c.get("relevance_score", 0.0),
                "page_number": c.get("page_number"),
                "section": c.get("section"),
                "document_id": c.get("document_id")
            })

        return {
            "top_k": top_k,
            "results": formatted_chunks,
            "no_sufficient_information": no_sufficient_info or len(formatted_chunks) == 0
        }
