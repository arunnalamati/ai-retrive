import io
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data

def test_upload_endpoint():
    file_content = b"Knowledge Retrieval System\nVector embeddings enable semantic similarity search."
    file = io.BytesIO(file_content)
    
    response = client.post(
        "/upload",
        files={"file": ("api_test_doc.txt", file, "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["chunks_created"] >= 1
    assert "document_id" in data

def test_documents_list_endpoint():
    response = client.get("/documents")
    assert response.status_code == 200
    docs = response.json()
    assert isinstance(docs, list)
    assert len(docs) >= 1
    assert "document_name" in docs[0]

def test_query_endpoint_factual():
    response = client.post(
        "/query",
        json={"query": "What enables semantic similarity search?", "top_k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["query_type"] == "factual"
    assert data["route"] == "retrieval"
    assert "response" in data
    assert len(data["retrieval"]["results"]) >= 1
    assert data["confidence"] in ["High", "Medium", "Low"]

def test_query_endpoint_ambiguous():
    response = client.post(
        "/query",
        json={"query": "How does it work?", "top_k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["query_type"] == "ambiguous"
    assert data["route"] == "clarification_required"
    assert "clarification" in data["response"].lower() or "ambiguous" in data["response"].lower()
