import pytest
import math
from backend.embeddings.embedding_service import get_embedding_service

def test_embedding_dimension():
    service = get_embedding_service()
    dim = service.get_dimension()
    assert dim == 384

def test_generate_query_embedding():
    service = get_embedding_service()
    emb = service.generate_query_embedding("What is Retrieval-Augmented Generation?")
    assert len(emb) == 384
    # Check normalized vector length is approximately 1.0
    norm = math.sqrt(sum(x * x for x in emb))
    assert abs(norm - 1.0) < 0.05

def test_generate_batch_embeddings():
    service = get_embedding_service()
    texts = [
        "First document about artificial intelligence.",
        "Second document discussing vector databases."
    ]
    embeddings = service.generate_embeddings(texts)
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 384
    assert len(embeddings[1]) == 384
