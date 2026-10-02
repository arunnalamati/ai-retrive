import os
import uuid
import pytest
from datetime import datetime, timezone, timedelta

from backend.database.analytics_db import AnalyticsDatabase
from backend.agents.orchestrator import AgentOrchestrator
from backend.agents.query_understanding_agent import QueryUnderstandingAgent
from backend.config import settings


@pytest.fixture
def temp_analytics_db(tmp_path):
    db_file = tmp_path / "test_analytics.db"
    return AnalyticsDatabase(db_path=str(db_file))


# ============================================================================
# UNIT TESTS
# ============================================================================

def test_analytics_logging_basic(temp_analytics_db):
    """Test direct logging of an analytics entry with all required fields."""
    entry = {
        "query_id": "test_q1",
        "conversation_id": "conv_123",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "query_text": "How many books can a student borrow?",
        "query_type": "factual",
        "domain": "College Library Policy",
        "theme": "Borrowing",
        "resolution_status": "ANSWERED",
        "clarification_required": False,
        "clarification_count": 0,
        "retrieved_documents": ["College_Library_Policy.txt"],
        "retrieved_chunks": ["chunk_001"],
        "retrieval_scores": [0.88],
        "confidence": 0.88,
        "response_latency": 0.125,
        "input_mode": "text",
        "response_text": "Students can borrow up to 4 books for 14 days.",
        "knowledge_gap": False,
        "failure_reason": None,
    }
    
    success = temp_analytics_db.log_query(entry)
    assert success is True
    
    queries = temp_analytics_db.get_queries(limit=10)
    assert len(queries) == 1
    q = queries[0]
    assert q["query_id"] == "test_q1"
    assert q["query_text"] == "How many books can a student borrow?"
    assert q["domain"] == "College Library Policy"
    assert q["theme"] == "Borrowing"
    assert q["resolution_status"] == "ANSWERED"
    assert q["knowledge_gap"] is False
    assert q["response_text"] == "Students can borrow up to 4 books for 14 days."


def test_knowledge_gap_detection(temp_analytics_db):
    """Test knowledge gap detection when query cannot be answered from KB."""
    entry = {
        "query_id": "test_gap_1",
        "conversation_id": "conv_gap",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "query_text": "What is the policy for off-campus submarine parking?",
        "query_type": "factual",
        "domain": "General Campus",
        "theme": "General",
        "resolution_status": "UNANSWERED",
        "clarification_required": False,
        "clarification_count": 0,
        "retrieved_documents": [],
        "retrieved_chunks": [],
        "retrieval_scores": [],
        "confidence": 0.0,
        "response_latency": 0.05,
        "input_mode": "text",
        "response_text": "I do not have sufficient information in the indexed documents to answer this question.",
        "knowledge_gap": True,
        "failure_reason": "No relevant chunks retrieved from indexed knowledge base.",
    }
    temp_analytics_db.log_query(entry)
    
    gaps = temp_analytics_db.get_knowledge_gaps()
    assert len(gaps) == 1
    assert gaps[0]["query_id"] == "test_gap_1"
    assert gaps[0]["knowledge_gap"] is True
    assert gaps[0]["resolution_status"] == "UNANSWERED"
    assert "No relevant chunks" in gaps[0]["failure_reason"]


def test_confidence_classification(temp_analytics_db):
    """Test confidence distribution classification and filtering."""
    # Log High, Medium, Low confidence queries
    entries = [
        {"query_id": "c1", "query_text": "Q1", "confidence": 0.85, "resolution_status": "ANSWERED"},
        {"query_id": "c2", "query_text": "Q2", "confidence": 0.60, "resolution_status": "ANSWERED"},
        {"query_id": "c3", "query_text": "Q3", "confidence": 0.30, "resolution_status": "LOW_CONFIDENCE"},
    ]
    for e in entries:
        full_e = {
            "conversation_id": "conv_c",
            "query_type": "factual",
            "domain": "College Library Policy",
            "theme": "General",
            "clarification_required": False,
            "clarification_count": 0,
            "retrieved_documents": [],
            "retrieved_chunks": [],
            "retrieval_scores": [],
            "response_latency": 0.1,
            "input_mode": "text",
            "response_text": "Test response",
            "knowledge_gap": False,
            "failure_reason": None,
            **e
        }
        temp_analytics_db.log_query(full_e)
        
    dist = temp_analytics_db.get_confidence_distribution()
    assert dist["high"] == 1
    assert dist["medium"] == 1
    assert dist["low"] == 1


def test_theme_detection():
    """Test theme extraction on queries."""
    from backend.database.analytics_db import _derive_theme
    
    agent = QueryUnderstandingAgent()
    c_lib = agent.classify("How many books can I borrow from the library?")
    assert c_lib["query_type"] in ["factual", "procedural"]
    theme_lib = _derive_theme("How many books can I borrow from the library?", "College Library Policy")
    assert theme_lib == "Book Borrowing"
    
    c_hostel = agent.classify("What is the hostel caution deposit and curfew time?")
    assert c_hostel["query_type"] in ["factual", "multi_part"]
    theme_hostel = _derive_theme("What is the hostel caution deposit?", "Hostel / Student Accommodation Policy")
    assert "Refund" in theme_hostel or "Hostel" in theme_hostel or "Deposit" in theme_hostel
    
    c_exam = agent.classify("What are the rules for examination revaluation and attendance?")
    assert c_exam["query_type"] in ["factual", "multi_part", "procedural"]
    theme_exam = _derive_theme("What are the rules for examination revaluation?", "Academic / Examination Policy")
    assert "Revaluation" in theme_exam



def test_analytics_aggregation_summary(temp_analytics_db):
    """Test summary aggregations: total_queries, answered, unanswered, average_confidence, latency."""
    # 2 answered, 1 unanswered, 1 low confidence
    samples = [
        {"query_id": "s1", "resolution_status": "ANSWERED", "confidence": 0.90, "response_latency": 0.10, "knowledge_gap": False},
        {"query_id": "s2", "resolution_status": "ANSWERED", "confidence": 0.80, "response_latency": 0.20, "knowledge_gap": False},
        {"query_id": "s3", "resolution_status": "UNANSWERED", "confidence": 0.10, "response_latency": 0.05, "knowledge_gap": True},
        {"query_id": "s4", "resolution_status": "LOW_CONFIDENCE", "confidence": 0.40, "response_latency": 0.15, "knowledge_gap": False},
    ]
    for s in samples:
        e = {
            "conversation_id": "conv_sum",
            "query_text": f"Query {s['query_id']}",
            "query_type": "factual",
            "domain": "College Library Policy",
            "theme": "General",
            "clarification_required": False,
            "clarification_count": 0,
            "retrieved_documents": [],
            "retrieved_chunks": [],
            "retrieval_scores": [],
            "input_mode": "text",
            "response_text": "Resp",
            "failure_reason": None,
            **s
        }
        temp_analytics_db.log_query(e)
        
    summary = temp_analytics_db.get_summary()
    assert summary["total_queries"] == 4
    assert summary["answered"] == 2
    assert summary["unanswered"] == 1
    assert summary["low_confidence"] == 1
    assert summary["knowledge_gaps"] == 1
    assert 0.54 <= summary["average_confidence"] <= 0.56
    assert 0.12 <= summary["average_response_time"] <= 0.13


def test_analytics_filtering(temp_analytics_db):
    """Test filtering by domain, query_type, status, confidence, and date."""
    base_time = datetime.now(timezone.utc)
    
    temp_analytics_db.log_query({
        "query_id": "f1",
        "conversation_id": "conv_f",
        "timestamp": (base_time - timedelta(days=2)).isoformat(),
        "query_text": "Library books",
        "query_type": "factual",
        "domain": "College Library Policy",
        "theme": "Borrowing",
        "resolution_status": "ANSWERED",
        "clarification_required": False,
        "clarification_count": 0,
        "retrieved_documents": [],
        "retrieved_chunks": [],
        "retrieval_scores": [],
        "confidence": 0.85,
        "response_latency": 0.1,
        "input_mode": "text",
        "response_text": "Answer 1",
        "knowledge_gap": False,
        "failure_reason": None
    })
    
    temp_analytics_db.log_query({
        "query_id": "f2",
        "conversation_id": "conv_f",
        "timestamp": base_time.isoformat(),
        "query_text": "Hostel fee refund",
        "query_type": "procedural",
        "domain": "Hostel / Student Accommodation Policy",
        "theme": "Fees",
        "resolution_status": "ANSWERED",
        "clarification_required": False,
        "clarification_count": 0,
        "retrieved_documents": [],
        "retrieved_chunks": [],
        "retrieval_scores": [],
        "confidence": 0.92,
        "response_latency": 0.2,
        "input_mode": "voice",
        "response_text": "Answer 2",
        "knowledge_gap": False,
        "failure_reason": None
    })
    
    # Filter by domain
    lib_queries = temp_analytics_db.get_queries(domain="College Library Policy")
    assert len(lib_queries) == 1
    assert lib_queries[0]["query_id"] == "f1"
    
    hostel_queries = temp_analytics_db.get_queries(domain="Hostel / Student Accommodation Policy")
    assert len(hostel_queries) == 1
    assert hostel_queries[0]["query_id"] == "f2"
    
    # Filter by query_type
    proc_queries = temp_analytics_db.get_queries(query_type="procedural")
    assert len(proc_queries) == 1
    assert proc_queries[0]["query_id"] == "f2"
    
    # Filter by min_confidence
    high_conf = temp_analytics_db.get_queries(min_confidence=0.90)
    assert len(high_conf) == 1
    assert high_conf[0]["query_id"] == "f2"


def test_latency_tracking(temp_analytics_db):
    """Test that response latency is accurately recorded and computed."""
    temp_analytics_db.log_query({
        "query_id": "lat_1",
        "conversation_id": "conv_lat",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "query_text": "Latency check",
        "query_type": "factual",
        "domain": "College Library Policy",
        "theme": "General",
        "resolution_status": "ANSWERED",
        "clarification_required": False,
        "clarification_count": 0,
        "retrieved_documents": [],
        "retrieved_chunks": [],
        "retrieval_scores": [],
        "confidence": 0.8,
        "response_latency": 0.342,
        "input_mode": "text",
        "response_text": "Done",
        "knowledge_gap": False,
        "failure_reason": None
    })
    
    queries = temp_analytics_db.get_queries(limit=1)
    assert abs(queries[0]["response_latency"] - 0.342) < 0.001


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

def test_query_to_analytics_pipeline():
    """Integration: Full orchestrator query execution automatically logs to analytics."""
    orchestrator = AgentOrchestrator()
    conv_id = f"test_e2e_{uuid.uuid4().hex[:8]}"
    
    result = orchestrator.process_query(
        query="How many books can an undergraduate student borrow from the library?",
        conversation_id=conv_id,
        top_k=2
    )
    
    assert result is not None
    assert result.get("response") is not None
    
    # Check that analytics logged the query
    db = AnalyticsDatabase()
    queries = db.get_queries(conversation_id=conv_id)
    assert len(queries) >= 1
    logged = queries[0]
    assert logged["conversation_id"] == conv_id
    assert "books" in logged["query_text"].lower()
    assert logged["resolution_status"] in ["ANSWERED", "LOW_CONFIDENCE"]
    assert logged["response_latency"] > 0


def test_retrieval_to_analytics():
    """Integration: Retrieved docs, chunks, and similarity scores are stored in analytics."""
    orchestrator = AgentOrchestrator()
    conv_id = f"test_ret_{uuid.uuid4().hex[:8]}"
    
    result = orchestrator.process_query(
        query="What is the late fine for overdue library books?",
        conversation_id=conv_id,
        top_k=3
    )
    
    db = AnalyticsDatabase()
    queries = db.get_queries(conversation_id=conv_id)
    assert len(queries) >= 1
    logged = queries[0]
    
    assert isinstance(logged["retrieved_documents"], list)
    assert isinstance(logged["retrieved_chunks"], (list, int))
    assert isinstance(logged["retrieval_scores"], list)


def test_clarification_to_analytics():
    """Integration: Ambiguous query triggers clarification and logs clarification_required=True."""
    orchestrator = AgentOrchestrator()
    conv_id = f"test_clar_{uuid.uuid4().hex[:8]}"
    
    result = orchestrator.process_query(
        query="policy",  # strictly ambiguous / single token
        conversation_id=conv_id
    )
    
    assert result.get("clarification_required") is True
    
    db = AnalyticsDatabase()
    queries = db.get_queries(conversation_id=conv_id)
    assert len(queries) >= 1
    logged = queries[0]
    assert logged["clarification_required"] is True
    assert logged["resolution_status"] == "CLARIFICATION_REQUIRED"


def test_memory_to_analytics():
    """Integration: Follow-up query logs under the same conversation_id with context tracking."""
    orchestrator = AgentOrchestrator()
    conv_id = f"test_mem_{uuid.uuid4().hex[:8]}"
    
    # Turn 1
    res1 = orchestrator.process_query(
        query="How many books can a student borrow?",
        conversation_id=conv_id
    )
    
    # Turn 2
    res2 = orchestrator.process_query(
        query="What about renewal?",
        conversation_id=conv_id
    )
    
    db = AnalyticsDatabase()
    queries = db.get_queries(conversation_id=conv_id)
    assert len(queries) == 2
    assert queries[0]["conversation_id"] == conv_id
    assert queries[1]["conversation_id"] == conv_id


def test_voice_query_to_analytics():
    """Integration: Voice input query path logs with input_mode='voice' without crashing."""
    orchestrator = AgentOrchestrator()
    conv_id = f"test_voice_{uuid.uuid4().hex[:8]}"
    
    result = orchestrator.process_query(
        query="What are the library operating hours on Sunday?",
        conversation_id=conv_id,
        input_mode="voice"
    )
    
    assert result is not None
    db = AnalyticsDatabase()
    queries = db.get_queries(conversation_id=conv_id)
    assert len(queries) >= 1
    logged = queries[0]
    assert logged["input_mode"] == "voice"


def test_unanswered_to_knowledge_gap_logging():
    """Integration: Completely unknown query logs UNANSWERED with knowledge_gap=True."""
    orchestrator = AgentOrchestrator()
    conv_id = f"test_gap_e2e_{uuid.uuid4().hex[:8]}"
    
    result = orchestrator.process_query(
        query="What is the quantum teleportation registration protocol for astronauts?",
        conversation_id=conv_id
    )
    
    db = AnalyticsDatabase()
    queries = db.get_queries(conversation_id=conv_id)
    assert len(queries) >= 1
    logged = queries[0]
    assert logged["knowledge_gap"] is True
    assert logged["resolution_status"] in ["UNANSWERED", "LOW_CONFIDENCE"]
    assert logged["failure_reason"] is not None

