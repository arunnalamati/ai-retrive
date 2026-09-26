import pytest
from backend.agents.conversation_memory_agent import ConversationMemoryAgent

@pytest.fixture
def memory_agent():
    return ConversationMemoryAgent()

def test_session_creation_and_recording(memory_agent):
    cid = memory_agent.get_or_create_session()
    assert cid is not None
    
    memory_agent.record_turn(
        conversation_id=cid,
        query="What is RAG?",
        response="RAG combines retrieval and generative synthesis.",
        query_type="factual",
        confidence="High",
        referenced_documents=["AI_RAG_Guide.txt"]
    )
    
    session = memory_agent.get_session(cid)
    assert session is not None
    assert session["active_topic"] == "RAG Architecture"
    assert "AI_RAG_Guide.txt" in session["referenced_documents"]
    assert len(session["messages"]) == 2

def test_coreference_resolution(memory_agent):
    cid = "test-session-coref"
    memory_agent.get_or_create_session(cid)
    memory_agent.record_turn(
        conversation_id=cid,
        query="What is RAG?",
        response="RAG combines dense vector retrieval and language generation.",
        query_type="factual",
        confidence="High"
    )

    # Next turn uses anaphoric pronoun 'its'
    follow_up = "What are its main steps?"
    resolved, was_resolved, topic = memory_agent.resolve_query_context(follow_up, cid)
    assert was_resolved is True
    assert "rag" in resolved.lower()
    assert topic == "RAG Architecture"

def test_context_continuation(memory_agent):
    cid = "test-session-continuation"
    memory_agent.get_or_create_session(cid)
    memory_agent.record_turn(
        conversation_id=cid,
        query="How many books can a student borrow?",
        response="Each student can borrow up to 4 books at a time.",
        query_type="factual",
        confidence="High",
        referenced_documents=["College_Library_Policy.txt"]
    )

    follow_up = "What about the renewal period?"
    resolved, was_resolved, topic = memory_agent.resolve_query_context(follow_up, cid)
    assert was_resolved is True
    assert "renewal" in resolved.lower()
    assert "library" in resolved.lower() or topic == "College Library Policy"

def test_context_switching(memory_agent):
    cid = "test-session-switching"
    memory_agent.get_or_create_session(cid)
    # Turn 1: RAG topic
    memory_agent.record_turn(
        conversation_id=cid,
        query="What is RAG?",
        response="RAG is Retrieval-Augmented Generation.",
        query_type="factual",
        confidence="High"
    )

    # Turn 2: Switches completely to College Library Policy
    switch_query = "How many books can students borrow?"
    resolved, was_resolved, topic = memory_agent.resolve_query_context(switch_query, cid)
    # Must NOT inject RAG into library query
    assert "rag" not in resolved.lower()
    assert topic == "College Library Policy"

def test_pending_clarification_lifecycle(memory_agent):
    cid = "test-session-clarify"
    memory_agent.set_pending_clarification(cid, {
        "original_query": "How long can I keep it?",
        "clarification_question": "Are you asking about the borrowing period for library books?",
        "missing_context": "What does 'it' refer to?"
    })
    
    pending = memory_agent.get_pending_clarification(cid)
    assert pending is not None
    assert pending["original_query"] == "How long can I keep it?"
    
    memory_agent.clear_pending_clarification(cid)
    assert memory_agent.get_pending_clarification(cid) is None
