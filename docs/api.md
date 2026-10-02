# REST API Documentation
## AI Knowledge Retrieval and Multi-Agent RAG System

Base URL: `http://127.0.0.1:8000`  
Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

---

## 1. Health Check
`GET /health`

### Response (200 OK)
```json
{
  "status": "ok",
  "service": "AI Knowledge Retrieval and Multi-Agent RAG System"
}
```

---

## 2. Document Upload & Ingestion
`POST /upload`  
Content-Type: `multipart/form-data`

### Form Parameters
- `file`: Binary file (PDF, DOCX, TXT, or CSV)

### Response (200 OK)
```json
{
  "success": true,
  "document_name": "AI_RAG_Guide.txt",
  "document_id": "doc_a1b2c3d4e5f6",
  "chunks_created": 3,
  "message": "Document indexed successfully"
}
```

---

## 3. List Documents
`GET /documents`

### Response (200 OK)
```json
[
  {
    "document_id": "doc_a1b2c3d4e5f6",
    "document_name": "AI_RAG_Guide.txt",
    "file_type": "txt",
    "chunks": 3,
    "upload_time": "2026-09-16T00:00:00",
    "status": "indexed"
  }
]
```

---

## 4. Execute RAG Query (Updated for Milestone 3)
`POST /query`  
Content-Type: `application/json`

### Request Body
```json
{
  "query": "How long can I keep it?",
  "top_k": 3,
  "conversation_id": "optional-uuid-string",
  "user_clarification": "optional clarification text"
}
```

### Response (200 OK)
```json
{
  "conversation_id": "8f9024a1-b42e-48a0-9c29-3732fa1d7c48",
  "query": "How long can I keep it?",
  "query_type": "factual",
  "classification_confidence": 0.92,
  "route": "retrieval",
  "clarification_required": false,
  "clarification": {
    "clarification_required": false,
    "original_query": "How long can I keep it?",
    "clarification_question": "Are you asking about the borrowing period for library books?",
    "user_clarification": "library books",
    "refined_query": "How long can a student keep a borrowed library book?"
  },
  "refined_query": "How long can a student keep a borrowed library book?",
  "retrieval": {
    "top_k": 3,
    "results": [
      {
        "document_name": "College_Library_Policy.txt",
        "chunk_id": "chunk_001",
        "content": "Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days.",
        "relevance_score": 0.884,
        "page_number": 1,
        "section": "Book Borrowing"
      }
    ],
    "no_sufficient_information": false
  },
  "response": "Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days.",
  "confidence": "High",
  "sources": [
    {
      "document_name": "College_Library_Policy.txt",
      "chunk_id": "chunk_001",
      "relevance_score": 0.884,
      "page_number": 1,
      "section": "Book Borrowing"
    }
  ],
  "transparency": {
    "supporting_chunks": [
      {
        "document_name": "College_Library_Policy.txt",
        "chunk_id": "chunk_001",
        "content": "Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days.",
        "relevance_score": 0.884,
        "page_number": 1,
        "section": "Book Borrowing"
      }
    ],
    "has_sufficient_evidence": true,
    "confidence_rationale": "Determined by vector similarity distance of top retrieved evidence chunks."
  },
  "active_topic": "College Library Policy",
  "pipeline_trace": [
    {
      "agent_name": "Conversation Memory Agent",
      "status": "completed",
      "details": "Session 8f9024a1... Active topic: 'College Library Policy'",
      "duration_ms": 0.6
    },
    {
      "agent_name": "Query Understanding Agent",
      "status": "completed",
      "details": "Classified as 'factual' (confidence: 0.92)",
      "duration_ms": 1.2
    },
    {
      "agent_name": "Retrieval Agent",
      "status": "completed",
      "details": "Retrieved 1 chunks (no_sufficient_info: False)",
      "duration_ms": 12.5
    },
    {
      "agent_name": "Response Generation Agent",
      "status": "completed",
      "details": "Synthesized grounded response strictly with retrieved context.",
      "duration_ms": 4.1
    }
  ]
}
```

---

## 5. Conversation Memory Management (Milestone 3.2)

### `GET /conversations/{conversation_id}`
Retrieves session turns, active topic, and referenced documents.

### `DELETE /conversations/{conversation_id}`
Clears short-term conversational context for the given session.

---

## 6. System Stats
`GET /stats`

### Response (200 OK)
```json
{
  "total_documents": 2,
  "total_chunks": 5,
  "collection_name": "knowledge_chunks",
  "vector_store": "ChromaDB (Persistent)",
  "status": "online"
}
```

---

## 7. Query Analytics Endpoints (Milestone 4.1)

### `GET /analytics/summary`
Returns high-level analytical KPI summaries.
- **Query Parameters**: `domain` (optional)
- **Response**:
```json
{
  "total_queries": 45,
  "answered": 41,
  "unanswered": 2,
  "low_confidence": 2,
  "clarification_count": 5,
  "knowledge_gap_count": 2,
  "avg_response_latency_ms": 115.4,
  "avg_confidence": 0.82
}
```

### `GET /analytics/queries`
Returns paginated query records with multi-dimensional filtering.
- **Query Parameters**:
  - `domain`: Filter by knowledge domain
  - `query_type`: Filter by intent (`factual`, `procedural`, etc.)
  - `status`: Filter by resolution status (`ANSWERED`, `UNANSWERED`, etc.)
  - `confidence`: Filter by confidence (`High`, `Medium`, `Low`)
  - `limit`, `offset`: Pagination parameters

### `GET /analytics/unanswered`
Lists queries that could not be grounded by the knowledge base.
- **Query Parameters**: `domain` (optional), `limit` (default: 50)

### `GET /analytics/knowledge-gaps`
Lists isolated knowledge gaps with diagnostic failure reasons.
- **Query Parameters**: `domain` (optional), `limit` (default: 50)

### `GET /analytics/themes`
Returns frequency counts of detected inquiry themes.
- **Query Parameters**: `domain` (optional)

### `GET /analytics/confidence`
Returns query counts grouped by confidence tier (`high`, `medium`, `low`).
- **Query Parameters**: `domain` (optional)

### `GET /analytics/types`
Returns query counts grouped by intent classification.
- **Query Parameters**: `domain` (optional)

### `GET /analytics/trends`
Returns daily query volume and resolution trends over time.
- **Query Parameters**: `domain` (optional), `days` (default: 7)

