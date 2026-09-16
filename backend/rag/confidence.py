from typing import List, Dict, Any, Literal

ConfidenceLevel = Literal["High", "Medium", "Low"]

def calculate_retrieval_confidence(
    retrieved_chunks: List[Dict[str, Any]],
    threshold: float = 0.35
) -> ConfidenceLevel:
    """
    Calculate application-level Retrieval Confidence deterministically based on
    actual retrieval quality:
    - High: top chunk relevance >= 0.65 and well above threshold
    - Medium: top chunk relevance between 0.45 and 0.65
    - Low: top chunk relevance < 0.45, or below threshold, or empty results

    This measures retrieval quality from vector space, NOT model hallucination probability.
    """
    if not retrieved_chunks:
        return "Low"

    valid_chunks = [c for c in retrieved_chunks if c.get("relevance_score", 0.0) >= threshold]
    if not valid_chunks:
        return "Low"

    top_score = valid_chunks[0].get("relevance_score", 0.0)

    if top_score >= 0.65:
        return "High"
    elif top_score >= 0.45:
        return "Medium"
    else:
        return "Low"
