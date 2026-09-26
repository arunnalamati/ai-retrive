import pytest
from backend.agents.orchestrator import MultiAgentOrchestrator
from backend.vectorstore.chroma_service import get_chroma_service
from backend.embeddings.embedding_service import get_embedding_service
from backend.agents.query_understanding_agent import QueryUnderstandingAgent
from backend.agents.clarification_agent import ClarificationAgent
from backend.agents.conversation_memory_agent import ConversationMemoryAgent
from backend.chunking.text_chunker import chunk_text
from backend.ingestion.cleaner import clean_text

@pytest.fixture(scope="module")
def setup_m3_test_system():
    chroma = get_chroma_service()
    embedder = get_embedding_service()

    # Seed College Library Policy chunks
    library_chunks = [
        {
            "id": "m3_eval_lib_01",
            "chunk_id": "library_01",
            "document_id": "doc_eval_lib",
            "document_name": "College_Library_Policy.txt",
            "file_type": "txt",
            "page_number": 1,
            "section": "Book Borrowing",
            "upload_time": "2026-09-23T00:00:00",
            "content": "Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days."
        },
        {
            "id": "m3_eval_lib_02",
            "chunk_id": "library_02",
            "document_id": "doc_eval_lib",
            "document_name": "College_Library_Policy.txt",
            "file_type": "txt",
            "page_number": 1,
            "section": "Renewal",
            "upload_time": "2026-09-23T00:00:00",
            "content": "A borrowed book can be renewed once for another 7 days if no other student has reserved the book."
        },
        {
            "id": "m3_eval_lib_03",
            "chunk_id": "library_03",
            "document_id": "doc_eval_lib",
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


# =====================================================================
# TEST 1 — AMBIGUOUS QUERY
# =====================================================================
def test_scenario_1_ambiguous_query(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    session_id = "test-scenario-1-ambiguous"

    res = orchestrator.process_query(
        query="How long can I keep it?",
        top_k=3,
        conversation_id=session_id
    )

    # Must ask clarification, not guess
    assert res["clarification_required"] is True
    assert res["route"] == "clarification_required"
    assert res["clarification"]["awaiting_clarification"] is True
    assert res["clarification"]["clarification_question"] is not None
    assert "referring to" in res["clarification"]["clarification_question"].lower() or "library" in res["clarification"]["clarification_question"].lower()


# =====================================================================
# TEST 2 — CLARIFICATION
# =====================================================================
def test_scenario_2_clarification_refinement(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    session_id = "test-scenario-2-clarify"

    # Step 1: Initial ambiguous query
    res1 = orchestrator.process_query(
        query="How long can I keep it?",
        top_k=3,
        conversation_id=session_id
    )
    assert res1["clarification_required"] is True

    # Step 2: User clarifies "Library book"
    res2 = orchestrator.process_query(
        query="",
        top_k=3,
        conversation_id=session_id,
        user_clarification="Library book"
    )

    assert res2["clarification_required"] is False
    assert res2["refined_query"] is not None
    assert "14 days" in res2["response"]
    assert res2["clarification"]["awaiting_clarification"] is False
    assert res2["clarification"]["clarification_response"] == "Library book"


# =====================================================================
# TEST 3 — MEMORY (Resolves "its" -> RAG)
# =====================================================================
def test_scenario_3_conversation_memory_coreference(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    session_id = "test-scenario-3-memory"

    # Turn 1: User asks "What is RAG?"
    res1 = orchestrator.process_query(
        query="What is RAG?",
        top_k=2,
        conversation_id=session_id
    )
    assert res1["confidence"] in ["High", "Medium"]

    # Turn 2: User asks "What are its main steps?"
    res2 = orchestrator.process_query(
        query="What are its main steps?",
        top_k=2,
        conversation_id=session_id
    )

    # System must resolve "its" to RAG
    assert res2["clarification_required"] is False
    assert res2["query_type"] == "procedural"
    assert "steps" in res2["response"].lower() or "pipeline" in res2["response"].lower()
    assert res2["memory_context"] is not None
    assert res2["memory_context"]["topic"] == "RAG Architecture"


# =====================================================================
# TEST 4 — LIBRARY CONTEXT (Context Continuation)
# =====================================================================
def test_scenario_4_library_context_continuation(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    session_id = "test-scenario-4-continuation"

    # Turn 1: "How many books can I borrow?"
    res1 = orchestrator.process_query(
        query="How many books can I borrow?",
        top_k=2,
        conversation_id=session_id
    )
    assert "4 books" in res1["response"]

    # Turn 2: "What about renewal?"
    res2 = orchestrator.process_query(
        query="What about renewal?",
        top_k=2,
        conversation_id=session_id
    )

    # Must understand renewal refers to library books
    assert res2["clarification_required"] is False
    assert "renew" in res2["response"].lower() or "7 days" in res2["response"]
    assert res2["active_topic"] == "College Library Policy"


# =====================================================================
# TEST 5 — CONTEXT SWITCH
# =====================================================================
def test_scenario_5_context_switching(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    session_id = "test-scenario-5-switch"

    # Turn 1: RAG context
    orchestrator.process_query(
        query="What is RAG?",
        top_k=2,
        conversation_id=session_id
    )

    # Turn 2: Switch to library books
    res2 = orchestrator.process_query(
        query="How many books can a student borrow?",
        top_k=2,
        conversation_id=session_id
    )

    assert res2["clarification_required"] is False
    assert "4 books" in res2["response"]
    assert res2["active_topic"] == "College Library Policy"
    assert any("College_Library_Policy.txt" in s["document_name"] for s in res2["sources"])


# =====================================================================
# TEST 6 — MULTI-PART QUERY
# =====================================================================
def test_scenario_6_multipart_query(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    query = "How many books can I borrow and what is the late return fine?"

    res = orchestrator.process_query(query=query, top_k=3)

    assert res["clarification_required"] is False
    # Must answer BOTH borrowing limit (4 books) and late fine (2 rupees)
    assert "4 books" in res["response"]
    assert "2 rupees" in res["response"]


# =====================================================================
# TEST 7 — VOICE INPUT INTEGRATION
# =====================================================================
def test_scenario_7_voice_input_pipeline(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    # Simulate transcription delivered from Web Speech API
    transcribed_speech = "How many books can a student borrow?"

    res = orchestrator.process_query(query=transcribed_speech, top_k=2)

    assert res["clarification_required"] is False
    assert "4 books" in res["response"]
    assert len(res["sources"]) > 0


# =====================================================================
# TEST 8 — TEXT TO SPEECH DATA CONTRACT
# =====================================================================
def test_scenario_8_tts_data_contract(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    res = orchestrator.process_query("What is RAG?", top_k=2)

    # Text answer is present and clean for browser window.speechSynthesis
    assert isinstance(res["response"], str)
    assert len(res["response"]) > 10
    assert "answer" in res
    assert res["answer"] == res["response"]


# =====================================================================
# TEST 9 — TRANSPARENCY PANEL DATA FIDELITY
# =====================================================================
def test_scenario_9_transparency_data_fidelity(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    res = orchestrator.process_query("How many books can a student borrow?", top_k=2)

    assert "transparency" in res
    transparency = res["transparency"]
    assert transparency["has_sufficient_evidence"] is True
    assert len(transparency["supporting_chunks"]) > 0

    top_chunk = transparency["supporting_chunks"][0]
    # Verify non-hallucinated, real retrieval metadata
    assert top_chunk["document_name"] == "College_Library_Policy.txt"
    assert top_chunk["chunk_id"] in ["library_01", "library_02", "library_03", "chunk_001"]
    assert "Each student can borrow up to 4 books" in top_chunk["content"]
    assert 0.0 <= top_chunk["relevance_score"] <= 1.0
    assert top_chunk["section"] is not None
    assert res["confidence"] in ["High", "Medium"]


# =====================================================================
# TEST 10 — UNAVAILABLE INFORMATION (Anti-Hallucination)
# =====================================================================
def test_scenario_10_unavailable_information(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    res = orchestrator.process_query("What is the hostel fee?", top_k=2)

    assert res["confidence"] == "Low"
    assert "couldn't find sufficient information" in res["response"].lower()
    assert res["transparency"]["has_sufficient_evidence"] is False
    assert len(res["sources"]) == 0


# =====================================================================
# TEST 11 — CONTEXT-DEPENDENT QUERY ("What about that?")
# =====================================================================
def test_scenario_11_context_dependent_query(setup_m3_test_system):
    orchestrator = setup_m3_test_system

    # Case A: WITHOUT prior context -> asks clarification instead of guessing
    no_context_session = "test-scenario-11-no-ctx"
    res_no_ctx = orchestrator.process_query(
        query="What about that?",
        top_k=2,
        conversation_id=no_context_session
    )
    assert res_no_ctx["clarification_required"] is True
    assert res_no_ctx["clarification"]["awaiting_clarification"] is True

    # Case B: WITH prior context -> uses memory to resolve
    ctx_session = "test-scenario-11-with-ctx"
    orchestrator.process_query("What is RAG?", top_k=2, conversation_id=ctx_session)
    res_with_ctx = orchestrator.process_query(
        query="What about that?",
        top_k=2,
        conversation_id=ctx_session
    )
    assert res_with_ctx["clarification_required"] is False
    assert res_with_ctx["active_topic"] == "RAG Architecture"


# =====================================================================
# TEST 12 — MULTI-TURN CLARIFICATION
# =====================================================================
def test_scenario_12_multi_turn_clarification(setup_m3_test_system):
    orchestrator = setup_m3_test_system
    session_id = "test-scenario-12-multiturn"

    # Step 1: User asks "How much can I borrow?"
    res1 = orchestrator.process_query(
        query="How much can I borrow?",
        top_k=2,
        conversation_id=session_id
    )
    assert res1["clarification_required"] is True
    assert res1["clarification"]["awaiting_clarification"] is True

    # Step 2: User responds "Books."
    res2 = orchestrator.process_query(
        query="",
        top_k=2,
        conversation_id=session_id,
        user_clarification="Books."
    )
    assert res2["clarification_required"] is False
    assert "4 books" in res2["response"]


# =====================================================================
# REGRESSION TESTS: MILESTONE 1 & MILESTONE 2 COMPATIBILITY
# =====================================================================
def test_m1_m2_regression_components():
    # 1. Text cleaning & chunking
    raw_text = "AI Retrieval System.\n\n   Chunking decomposes long documents.  \n"
    cleaned = clean_text(raw_text)
    assert "AI Retrieval System." in cleaned

    chunks = chunk_text(cleaned, chunk_size=100, chunk_overlap=20)
    assert len(chunks) >= 1

    # 2. Embedding generation
    embedder = get_embedding_service()
    vectors = embedder.generate_embeddings(["Vector test query"])
    assert len(vectors) == 1
    assert len(vectors[0]) == 384

    # 3. Query classification
    classifier = QueryUnderstandingAgent()
    assert classifier.classify("What is RAG?")["query_type"] == "factual"
    assert classifier.classify("What are the steps to build a RAG pipeline?")["query_type"] == "procedural"
    assert classifier.classify("What is the difference between RAG and Fine-tuning?")["query_type"] == "comparative"
    assert classifier.classify("How does it work?")["query_type"] == "ambiguous"
