import pytest
from backend.agents.clarification_agent import ClarificationAgent

@pytest.fixture
def clarification_agent():
    return ClarificationAgent()

def test_detect_ambiguous_queries(clarification_agent):
    ambiguous_examples = [
        "How long can I keep it?",
        "How does it work?",
        "What is the fee?",
        "What are its advantages?",
        "What about that document?"
    ]
    for q in ambiguous_examples:
        res = clarification_agent.evaluate_ambiguity(q)
        assert res["clarification_required"] is True, f"Failed to detect ambiguity in: {q}"
        assert res["clarification_question"] is not None
        assert res["missing_context"] is not None

def test_targeted_follow_up_question(clarification_agent):
    res = clarification_agent.evaluate_ambiguity("How long can I keep it?")
    assert res["clarification_required"] is True
    assert "borrowing period" in res["clarification_question"].lower()
    assert "library books" in res["clarification_question"].lower()

def test_non_ambiguous_query(clarification_agent):
    confident_queries = [
        "What is RAG?",
        "How many books can a student borrow?",
        "What is the late return fine for library books?",
        "How many annual leave days does an employee receive?"
    ]
    for q in confident_queries:
        res = clarification_agent.evaluate_ambiguity(q)
        assert res["clarification_required"] is False, f"Erroneously flagged clear query: {q}"
        assert res["clarification_question"] is None

def test_refine_query(clarification_agent):
    refined = clarification_agent.refine_query(
        original_query="How long can I keep it?",
        user_clarification="library books",
        clarification_question="Are you asking about the borrowing period for library books?"
    )
    assert "library book" in refined.lower()
    assert "keep" in refined.lower() or "borrow" in refined.lower()

def test_multipart_query_decomposition(clarification_agent):
    query = "How many books can I borrow and what is the late return fine?"
    parts = clarification_agent.decompose_multipart(query)
    assert parts is not None
    assert len(parts) == 2
    assert "borrow" in parts[0].lower()
    assert "fine" in parts[1].lower()

    eval_result = clarification_agent.evaluate_ambiguity(query)
    assert eval_result["clarification_required"] is False
    assert len(eval_result.get("multipart_subqueries", [])) == 2
