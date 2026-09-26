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

    # Query ChromaDB with sufficient candidate window for deduplication
    fetch_k = max(top_k * 4, 10)
    raw_results = chroma_service.query_chunks(query_emb, top_k=fetch_k)

    if not raw_results:
        return [], True

    # Deduplicate candidate chunks with identical or near-identical text
    deduped_raw = []
    seen_texts = set()
    for item in raw_results:
        sig = " ".join(item.get("content", "").split())[:120].lower()
        if sig not in seen_texts:
            seen_texts.add(sig)
            deduped_raw.append(item)
        if len(deduped_raw) >= top_k:
            break

    # Filter by relevance threshold
    filtered_results = [
        item for item in deduped_raw
        if item.get("relevance_score", 0.0) >= threshold
    ]

    if not filtered_results:
        return deduped_raw[:top_k], True

    return filtered_results[:top_k], False
