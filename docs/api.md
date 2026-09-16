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

## 4. Execute RAG Query
`POST /query`  
Content-Type: `application/json`

### Request Body
```json
{
  "query": "What is RAG?",
  "top_k": 3
}
```

### Response (200 OK)
```json
{
  "query": "What is RAG?",
  "query_type": "factual",
  "classification_confidence": 0.92,
  "route": "retrieval",
  "retrieval": {
    "top_k": 3,
    "results": [
      {
        "document_name": "AI_RAG_Guide.txt",
        "chunk_id": "chunk_001",
        "content": "Retrieval-Augmented Generation (RAG) combines information retrieval with text generation...",
        "relevance_score": 0.912,
        "page_number": null,
        "section": "Main Document"
      }
    ],
    "no_sufficient_information": false
  },
  "response": "Retrieval-Augmented Generation (RAG) combines information retrieval with text generation.",
  "confidence": "High",
  "sources": [
    {
      "document_name": "AI_RAG_Guide.txt",
      "chunk_id": "chunk_001",
      "relevance_score": 0.912,
      "page_number": null,
      "section": "Main Document"
    }
  ],
  "pipeline_trace": [
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

## 5. System Stats
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
