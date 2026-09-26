import pytest
from backend.vectorstore.chroma_service import get_chroma_service
from backend.embeddings.embedding_service import get_embedding_service
from backend.rag.retrieval import search_knowledge_base

@pytest.fixture(scope="module")
def setup_test_knowledge():
    chroma = get_chroma_service()
    embedder = get_embedding_service()
    
    test_chunks = [
        {
            "id": "doc_test_c001",
            "chunk_id": "chunk_001",
            "document_id": "doc_test",
            "document_name": "rag_test.txt",
            "file_type": "txt",
            "page_number": 1,
            "section": "Overview",
            "upload_time": "2026-09-16T00:00:00",
            "content": "Retrieval-Augmented Generation (RAG) is an architecture that augments language models with external vector search."
        },
        {
            "id": "doc_test_c002",
            "chunk_id": "chunk_002",
            "document_id": "doc_test",
            "document_name": "rag_test.txt",
            "file_type": "txt",
            "page_number": 1,
            "section": "Components",
            "upload_time": "2026-09-16T00:00:00",
            "content": "A standard vector database like ChromaDB stores dense vector embeddings and computes cosine similarity."
        },
        {
            "id": "doc_leave_c001",
            "chunk_id": "chunk_001",
            "document_id": "doc_leave",
            "document_name": "leave_test.txt",
            "file_type": "txt",
            "page_number": 1,
            "section": "Policy",
            "upload_time": "2026-09-16T00:00:00",
            "content": "Employees receive 24 days of annual leave per calendar year."
        }
    ]
    
    texts = [c["content"] for c in test_chunks]
    embs = embedder.generate_embeddings(texts)
    chroma.add_chunks(test_chunks, embs)
    return chroma

def test_semantic_retrieval_ranking(setup_test_knowledge):
    results, no_info = search_knowledge_base("What is RAG architecture?", top_k=2)
    assert not no_info
    assert any(doc in results[0]["document_name"] for doc in ["rag_test.txt", "AI_RAG_Guide.txt"])
    assert results[0]["relevance_score"] > 0.40

def test_top_k_selection(setup_test_knowledge):
    results_top1, _ = search_knowledge_base("leave policy days", top_k=1)
    assert len(results_top1) == 1
    
    results_top3, _ = search_knowledge_base("leave policy days", top_k=3)
    assert len(results_top3) <= 3

def test_domain_separation(setup_test_knowledge):
    # Query for employee leave should rank leave_test.txt highest
    results, _ = search_knowledge_base("How many annual leave days are provided?", top_k=1)
    assert results[0]["document_name"] == "leave_test.txt"
    assert "24 days" in results[0]["content"]

def test_high_threshold_no_info(setup_test_knowledge):
    # Extremely irrelevant query with strict threshold
    results, no_info = search_knowledge_base(
        "Quantum entanglement in astrophysics black holes",
        top_k=2,
        threshold=0.85
    )
    assert no_info is True
