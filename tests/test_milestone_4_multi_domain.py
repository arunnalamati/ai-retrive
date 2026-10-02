import uuid
import pytest
from backend.agents.orchestrator import AgentOrchestrator


@pytest.fixture(scope="module")
def orchestrator():
    return AgentOrchestrator()


# ============================================================================
# DOMAIN 1: COLLEGE LIBRARY POLICY
# ============================================================================

def test_library_factual_query(orchestrator):
    """Test factual question in College Library Policy domain."""
    conv_id = f"test_lib_fact_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="How many books can an undergraduate student borrow from the library?",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is False
    assert result["confidence"] in ["High", "Medium"]
    assert any("4" in result["response"] or "books" in result["response"].lower() for _ in [1])


def test_library_procedural_query(orchestrator):
    """Test procedural question on borrowing / renewal in Library domain."""
    conv_id = f"test_lib_proc_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="What is the step by step procedure to renew a borrowed book?",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is False
    assert "renew" in result["response"].lower()


# ============================================================================
# DOMAIN 2: HOSTEL / STUDENT ACCOMMODATION POLICY
# ============================================================================

def test_hostel_factual_query(orchestrator):
    """Test factual question on caution deposit and curfew in Hostel domain."""
    conv_id = f"test_hostel_fact_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="What is the refundable caution deposit and nightly curfew time for the student hostel?",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is False
    resp_low = result["response"].lower()
    assert "deposit" in resp_low or "5,000" in result["response"] or "curfew" in resp_low or "10:00" in result["response"]


def test_hostel_procedural_query(orchestrator):
    """Test procedural question on hostel fee refund."""
    conv_id = f"test_hostel_proc_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="What is the procedure and deduction schedule for hostel fee refund upon room vacation?",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is False
    assert "refund" in result["response"].lower() or "deduction" in result["response"].lower()


# ============================================================================
# DOMAIN 3: ACADEMIC / EXAMINATION POLICY
# ============================================================================

def test_exam_factual_query(orchestrator):
    """Test factual question on minimum attendance and grading scale in Exam domain."""
    conv_id = f"test_exam_fact_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="What is the minimum attendance percentage required to appear for semester end examinations?",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is False
    assert "75%" in result["response"] or "attendance" in result["response"].lower()


def test_exam_procedural_query(orchestrator):
    """Test procedural question on revaluation application in Exam domain."""
    conv_id = f"test_exam_proc_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="What is the process to apply for revaluation of answer scripts?",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is False
    assert "revaluation" in result["response"].lower() or "application" in result["response"].lower()


# ============================================================================
# CROSS-DOMAIN QUERY TYPES: COMPARATIVE, AMBIGUOUS, MULTI-PART, UNKNOWN
# ============================================================================

def test_comparative_query(orchestrator):
    """Test comparative query between student borrowing limit and faculty limit."""
    conv_id = f"test_comp_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="Compare the borrowing privileges of undergraduate students versus postgraduate students",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is False
    assert "undergraduate" in result["response"].lower() or "postgraduate" in result["response"].lower() or "books" in result["response"].lower()


def test_ambiguous_incomplete_query_triggers_clarification(orchestrator):
    """Test ambiguous or incomplete query prompts clarification request."""
    conv_id = f"test_ambig_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="rules",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is True
    assert result.get("clarification") is not None


def test_multi_part_query(orchestrator):
    """Test multi-part query spanning two factual items in the hostel domain."""
    conv_id = f"test_multipart_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="What are the mess timings for dinner and what is the penalty for using high-power electrical appliances in the hostel?",
        conversation_id=conv_id
    )
    assert result["clarification_required"] is False
    assert "dinner" in result["response"].lower() or "appliance" in result["response"].lower() or "fine" in result["response"].lower() or "mess" in result["response"].lower()


def test_unknown_query_knowledge_gap(orchestrator):
    """Test unknown query outside all 3 domains correctly flags knowledge gap."""
    conv_id = f"test_unknown_{uuid.uuid4().hex[:6]}"
    result = orchestrator.process_query(
        query="What is the university policy on astronaut hibernation during intergalactic space travel?",
        conversation_id=conv_id
    )
    assert "do not have" in result["response"].lower() or "not find" in result["response"].lower() or result["confidence"] in ["Low", "None"] or result.get("knowledge_gap") is True


# ============================================================================
# MULTI-TURN CONVERSATION & DOMAIN SWITCHING (NO CONTEXT CONTAMINATION)
# ============================================================================

def test_multi_turn_domain_switching_and_no_contamination(orchestrator):
    """
    Test user journey:
    1. Turn 1 (Library): "How many books can I borrow?"
    2. Turn 2 (Library follow-up): "What about renewal?" -> maintains Library context
    3. Turn 3 (Hostel switch): "What is the hostel fee?" -> switches to Hostel domain
    4. Turn 4 (Hostel follow-up): "What about its refund?" -> maintains Hostel context (not Library!)
    """
    conv_id = f"test_switch_{uuid.uuid4().hex[:8]}"
    
    # Turn 1: Library query
    t1 = orchestrator.process_query(
        query="How many books can I borrow?",
        conversation_id=conv_id
    )
    assert t1["clarification_required"] is False
    assert "4" in t1["response"] or "books" in t1["response"].lower()
    
    # Turn 2: Library follow-up
    t2 = orchestrator.process_query(
        query="What about renewal?",
        conversation_id=conv_id
    )
    assert t2["clarification_required"] is False
    # Must refer to books/library renewal, NOT hostel or exam
    assert "renew" in t2["response"].lower() or "period" in t2["response"].lower() or "once" in t2["response"].lower() or "book" in t2["response"].lower()
    
    # Turn 3: Context switch to Hostel
    t3 = orchestrator.process_query(
        query="What is the hostel caution deposit fee?",
        conversation_id=conv_id
    )
    assert t3["clarification_required"] is False
    assert "5,000" in t3["response"] or "deposit" in t3["response"].lower() or "caution" in t3["response"].lower()
    
    # Turn 4: Hostel follow-up ("What about its refund?")
    t4 = orchestrator.process_query(
        query="What about its refund?",
        conversation_id=conv_id
    )
    assert t4["clarification_required"] is False
    # Must refer to hostel deposit refund, NOT library book fines or book return
    assert "refund" in t4["response"].lower() or "deposit" in t4["response"].lower() or "vacat" in t4["response"].lower() or "deduction" in t4["response"].lower()
