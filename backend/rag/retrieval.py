from typing import List, Dict, Any, Tuple
from backend.embeddings.embedding_service import get_embedding_service
from backend.vectorstore.chroma_service import get_chroma_service
from backend.config import settings

def search_knowledge_base(
    query: str,
    top_k: int = 3,
    threshold: float = None
) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Generate query embedding, search ChromaDB, rank results, and apply threshold filtering.
    Returns: (filtered_chunks, no_sufficient_information_flag)
    """
    if threshold is None:
        threshold = settings.RETRIEVAL_THRESHOLD

    embedding_service = get_embedding_service()
    chroma_service = get_chroma_service()

    # Generate query embedding
    query_emb = embedding_service.generate_query_embedding(query)

    # Query ChromaDB
    raw_results = chroma_service.query_chunks(query_emb, top_k=top_k)

    if not raw_results:
        return [], True

    # Filter by relevance threshold
    filtered_results = [
        item for item in raw_results
        if item.get("relevance_score", 0.0) >= threshold
    ]

    if not filtered_results:
        # Return all raw results but flag no_sufficient_information = True
        return raw_results, True

    return filtered_results, False
