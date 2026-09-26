import pytest
from backend.agents.orchestrator import MultiAgentOrchestrator
from backend.vectorstore.chroma_service import get_chroma_service
from backend.embeddings.embedding_service import get_embedding_service

@pytest.fixture(scope="module")
def setup_m3_environment():
    # Ensure test documents are populated in ChromaDB
    chroma = get_chroma_service()
    embedder = get_embedding_service()

    library_chunks = [
        {
            "id": "m3_lib_c001",
            "chunk_id": "chunk_001",
            "document_id": "doc_lib_01",
            "document_name": "College_Library_Policy.txt",
            "file_type": "txt",
            "page_number": 1,
            "section": "Book Borrowing",
            "upload_time": "2026-09-23T00:00:00",
            "content": "Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days."
        },
        {
            "id": "m3_lib_c002",
            "chunk_id": "chunk_002",
            "document_id": "doc_lib_01",
            "document_name": "College_Library_Policy.txt",
            "file_type": "txt",
            "page_number": 1,
            "section": "Renewal",
            "upload_time": "2026-09-23T00:00:00",
            "content": "A borrowed book can be renewed once for another 7 days if no other student has reserved the book."
        },
        {
            "id": "m3_lib_c003",
            "chunk_id": "chunk_003",
            "document_id": "doc_lib_01",
            "document_name": "College_Library_Policy.txt",
            "file_type": "txt",
            "page_number": 1,
            "section": "Late Returns",
            "upload_time": "2026-09-23T00:00:00",
            "content": "A fine of 2 rupees per book is charged for each day after the due date."
        }
    ]
    texts = [c["content"] for c in library_chunks]
    embs = embedder.generate_embeddings(texts)
    chroma.add_chunks(library_chunks, embs)
    return MultiAgentOrchestrator()

def test_m3_ambiguous_flow_and_refinement(setup_m3_environment):
    orchestrator = setup_m3_environment
    session_id = "test-m3-ambiguous-flow"

    # 1. Ask ambiguous query
    res1 = orchestrator.process_query(
        query="How long can I keep it?",
        top_k=3,
        conversation_id=session_id
    )
    assert res1["clarification_required"] is True
    assert res1["route"] == "clarification_required"
    assert "borrowing period" in res1["response"].lower() or "library" in res1["response"].lower()
    assert res1["clarification"]["clarification_question"] is not None

    # 2. Provide clarification
    res2 = orchestrator.process_query(
        query="",
        top_k=3,
        conversation_id=session_id,
        user_clarification="library books"
    )
    assert res2["clarification_required"] is False
    assert res2["refined_query"] is not None
    assert "14 days" in res2["response"]
    assert res2["confidence"] in ["High", "Medium"]
    assert len(res2["transparency"]["supporting_chunks"]) > 0

def test_m3_conversation_memory_coreference(setup_m3_environment):
    orchestrator = setup_m3_environment
    session_id = "test-m3-coref-session"

    # Turn 1
    res1 = orchestrator.process_query("What is RAG?", top_k=2, conversation_id=session_id)
    assert res1["confidence"] in ["High", "Medium"]

    # Turn 2: Follow-up with 'its main steps'
    res2 = orchestrator.process_query("What are its main steps?", top_k=2, conversation_id=session_id)
    assert res2["clarification_required"] is False
    assert "steps" in res2["response"].lower() or "pipeline" in res2["response"].lower()

def test_m3_context_switching(setup_m3_environment):
    orchestrator = setup_m3_environment
    session_id = "test-m3-switch-session"

    # Turn 1: RAG
    orchestrator.process_query("What is RAG?", top_k=2, conversation_id=session_id)

    # Turn 2: Switch to library books
    res2 = orchestrator.process_query("How many books can a student borrow?", top_k=2, conversation_id=session_id)
    assert res2["clarification_required"] is False
    assert "4 books" in res2["response"]
    assert res2["active_topic"] == "College Library Policy"
    assert any("College_Library_Policy.txt" in s["document_name"] for s in res2["sources"])

def test_m3_multipart_query(setup_m3_environment):
    orchestrator = setup_m3_environment
    query = "How many books can I borrow and what is the late return fine?"
    res = orchestrator.process_query(query=query, top_k=3)
    assert res["clarification_required"] is False
    # Verifies both parts answered
    assert "4 books" in res["response"]
    assert "2 rupees" in res["response"]

def test_m3_response_transparency_structure(setup_m3_environment):
    orchestrator = setup_m3_environment
    res = orchestrator.process_query("How many books can a student borrow?", top_k=3)
    
    assert "transparency" in res
    transparency = res["transparency"]
    assert transparency["has_sufficient_evidence"] is True
    assert len(transparency["supporting_chunks"]) > 0
    top_chunk = transparency["supporting_chunks"][0]
    assert "document_name" in top_chunk
    assert "chunk_id" in top_chunk
    assert "relevance_score" in top_chunk
    assert "content" in top_chunk
    assert top_chunk["relevance_score"] >= 0.0

def test_m3_low_confidence_transparency(setup_m3_environment):
    orchestrator = setup_m3_environment
    res = orchestrator.process_query("What is the hostel fee?", top_k=2)
    assert res["confidence"] == "Low"
    assert "couldn't find sufficient information" in res["response"].lower()
    assert res["transparency"]["has_sufficient_evidence"] is False
