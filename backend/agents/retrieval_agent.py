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
        threshold: float = None,
        subqueries: List[str] = None
    ) -> Dict[str, Any]:
        if threshold is None:
            threshold = settings.RETRIEVAL_THRESHOLD

        if subqueries and len(subqueries) > 1:
            all_chunks = []
            seen_ids = set()
            any_sufficient = False
            for sq in subqueries:
                sq_chunks, sq_no_info = search_knowledge_base(
                    query=sq,
                    top_k=top_k,
                    threshold=threshold
                )
                if not sq_no_info:
                    any_sufficient = True
                for c in sq_chunks:
                    cid = c.get("chunk_id") or c.get("id") or c.get("content", "")[:30]
                    if cid not in seen_ids:
                        seen_ids.add(cid)
                        all_chunks.append(c)
            # Also search full query
            full_chunks, full_no_info = search_knowledge_base(
                query=query,
                top_k=top_k,
                threshold=threshold
            )
            if not full_no_info:
                any_sufficient = True
            for c in full_chunks:
                cid = c.get("chunk_id") or c.get("id") or c.get("content", "")[:30]
                if cid not in seen_ids:
                    seen_ids.add(cid)
                    all_chunks.append(c)

            all_chunks.sort(key=lambda x: x.get("relevance_score", 0.0), reverse=True)
            chunks = all_chunks[:top_k * 2]
            no_sufficient_info = not any_sufficient
        else:
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
                "distance": c.get("distance"),
                "page_number": c.get("page_number"),
                "section": c.get("section"),
                "document_id": c.get("document_id")
            })

        return {
            "top_k": top_k,
            "results": formatted_chunks,
            "no_sufficient_information": no_sufficient_info or len(formatted_chunks) == 0
        }
