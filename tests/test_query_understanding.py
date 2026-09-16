import pytest
from backend.agents.query_understanding_agent import QueryUnderstandingAgent

@pytest.fixture
def query_agent():
    return QueryUnderstandingAgent()

def test_factual_query(query_agent):
    res = query_agent.classify("What is RAG?")
    assert res["query_type"] == "factual"
    assert res["route"] == "retrieval"
    assert res["classification_confidence"] >= 0.85

def test_procedural_query(query_agent):
    res = query_agent.classify("What are the steps in a RAG pipeline?")
    assert res["query_type"] == "procedural"
    assert res["route"] == "retrieval"
    assert res["classification_confidence"] >= 0.85

def test_comparative_query(query_agent):
    res = query_agent.classify("What is the difference between the Retrieval Agent and Response Generation Agent?")
    assert res["query_type"] == "comparative"
    assert res["route"] == "retrieval"
    assert res["classification_confidence"] >= 0.85

def test_ambiguous_query(query_agent):
    res = query_agent.classify("How does it work?")
    assert res["query_type"] == "ambiguous"
    assert res["route"] == "clarification_required"
    assert res["classification_confidence"] >= 0.80

def test_employee_factual(query_agent):
    res = query_agent.classify("How many annual leave days does an employee receive?")
    assert res["query_type"] == "factual"
    assert res["route"] == "retrieval"
