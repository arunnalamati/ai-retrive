# System Architecture
## AI Knowledge Retrieval and Multi-Agent RAG System

This document outlines the detailed system architecture, component boundaries, and data flows.

---

## 1. High-Level System Diagram

```
+---------------------------------------------------------------------------------+
|                                 FRONTEND (React + Vite)                          |
|  - Dashboard Overview     - Drag-and-Drop Ingestion     - Voice Input (Web STT)  |
|  - Real-time Pipeline     - Semantic Results Viewer     - Audio TTS Synthesis    |
+---------------------------------------------------------------------------------+
                                      |   HTTP / JSON (REST API)
                                      v
+---------------------------------------------------------------------------------+
|                                 BACKEND (FastAPI API)                           |
|  POST /upload             GET /documents             POST /query    GET /health |
+---------------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v (Ingestion Flow)                                        v (Inference Flow)
+------------------------------------+             +------------------------------+
| Ingestion & Chunking Pipeline      |             | Multi-Agent Orchestrator     |
| 1. Detect File Type (.pdf/.docx...) |             | 1. Query Understanding Agent |
| 2. Extract & Clean Text            |             | 2. Ambiguity / Routing Gate  |
| 3. Recursive Window Chunking       |             | 3. Retrieval Agent           |
| 4. Vector Embedding Generation     |             | 4. Response Generation Agent |
+------------------------------------+             | 5. Clarification Agent       |
         |                           |             | 6. Conversation Memory Agent |
         v                           v             +------------------------------+
+------------------+       +-------------------+                   |
| SQLite Metadata  |       | ChromaDB Store    | <-----------------+
| (data/metadata.db|       | (data/chroma/)    |
+------------------+       +-------------------+
```

---

## 2. Ingestion Flow (Milestone 1)

```
User uploads File (PDF, DOCX, TXT, CSV)
      ↓
[FastAPI /upload]
      ↓
[Document Loader Router]
      ├─ .pdf  → pypdf (Extracts per-page text & page numbers)
      ├─ .docx → python-docx (Extracts headings & paragraph sections)
      ├─ .txt  → UTF-8 Safe File Stream
      └─ .csv  → pandas (Converts rows to descriptive statements)
      ↓
[Cleaner Module]
      Removes control characters, collapses whitespace, normalizes newlines
      ↓
[Text Chunker]
      Applies character window (700 chars, 120 overlap, boundary-aware)
      Tags each chunk: document_id, document_name, chunk_id, page_no, section
      ↓
[Embedding Service (Singleton)]
      Computes 384-dimensional unit-normalized dense vectors (all-MiniLM-L6-v2)
      ↓
[ChromaDB Persistent Collection]
      Stores embeddings, chunk text, and primitive metadata
      ↓
[SQLite Database]
      Records document status, chunk counts, file path, upload time
```

---

## 3. Query Processing Flow (Milestone 2)

```
User Query Input (or Web Speech STT)
      ↓
[FastAPI /query]
      ↓
[Multi-Agent Orchestrator]
      ↓
[Query Understanding Agent]
      Classifies Query:
      • Factual      → Route: retrieval
      • Procedural   → Route: retrieval
      • Comparative  → Route: retrieval
      • Ambiguous    → Route: clarification_required
      ↓
      ├── If Ambiguous ──> [Clarification Agent] ──> Returns guided clarification
      │
      └── If Retrieval ──> [Retrieval Agent]
                                  ↓
                           [Embedding Service]
                           Vectorizes query to 384-d
                                  ↓
                           [ChromaDB Vector Store]
                           Cosine similarity query (Top-K: 1, 3, or 5)
                                  ↓
                           [Threshold Filter (0.35)]
                           Discards low-relevance noise
                                  ↓
                           [Response Generation Agent]
                           Synthesizes answer grounded in top chunks (Zero Hallucination)
                                  ↓
                           [Confidence Estimator]
                           Calculates Retrieval Confidence: High / Medium / Low
                                  ↓
                           [Source Attribution]
                           Attaches document name, chunk ID, relevance %, page/section
```

---

## 4. Storage Architecture

- **`data/uploads/`**: Raw uploaded files saved with unique document ID prefixes.
- **`data/chroma/`**: Persistent ChromaDB parquet and sqlite vector index files.
- **`data/metadata.db`**: Local SQLite database for rapid document listing, deletion, and system telemetry.
