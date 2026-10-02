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

## 4. Multi-Agent Conversational Flow (Milestone 3)

```
User Query Input (Text or Web Speech API Dictation)
      ↓
[FastAPI /query]
      ↓
[Multi-Agent Orchestrator]
      ↓
[Step 1: Conversation Memory Agent]
      • Checks for active pending clarification response
      • Resolves anaphoric coreferences ("its" → "RAG pipeline")
      • Detects context continuation ("renewal" → College Library Policy)
      • Enforces clean context switching across distinct domains
      • Formulates resolved query and updates session context
      ↓
[Step 2: Clarification Agent - Ambiguity Evaluation]
      • Checks if query has missing referents or unclear intent
      ├── If Ambiguous & Unresolved:
      │     - Sets awaiting_clarification: true
      │     - Returns targeted follow-up question
      │     - Halts before vector retrieval to prevent false search
      └── If Clear or Resolved:
            Proceeds to Step 3
      ↓
[Step 3: Query Understanding Agent]
      • Classifies resolved query: factual, procedural, comparative, or ambiguous
      • Computes intent classification confidence score
      ↓
[Step 4: Retrieval Agent]
      • Embeds query using local SentenceTransformer
      • Decomposes compound multi-part queries if present
      • Executes dense cosine similarity search in ChromaDB
      • Filters by relevance threshold (0.35)
      ↓
[Step 5: Response Generation Agent]
      • Grounded extractive synthesis strictly derived from retrieved evidence
      • Assembles multi-part answers (e.g. 4 books and 2 rupees fine)
      • Returns strict no-information refusal if evidence is insufficient
      ↓
[Step 6: Response Transparency Panel & TTS Assembly]
      • Records supporting chunks, document name, chunk ID, relevance %, section
      • Formats confidence rating: High, Medium, or Low
      • Prepares clean text for Web Speech window.speechSynthesis
      ↓
[Step 7: Session Memory Record Turn]
      • Appends user and assistant messages, active topic, cited documents to session memory
      • Strict isolation: Never writes ephemeral conversation history to ChromaDB
```

---

## 5. Storage Architecture & Memory Isolation

- **`data/uploads/`**: Raw uploaded files saved with unique document ID prefixes.
- **`data/chroma/`**: Persistent ChromaDB parquet and sqlite vector index files. Represents the permanent Knowledge Base.
- **`data/metadata.db`**: Local SQLite database for document metadata, chunk counts, file paths, upload times, and indexing status.
- **Conversation Memory Store (`backend/agents/conversation_memory_agent.py`)**:
  - Maintained in-process with session ID scoping (`conversation_id`).
  - Stores multi-turn history, active topic, entities, referenced documents, and pending clarification state.
  - **Strict Architectural Separation**: Conversation memory is completely decoupled from the ChromaDB vector store to prevent conversational noise from polluting the permanent knowledge base.

---

## 6. Query Analytics & Knowledge Gap Detection (Milestone 4)

- **Persistent Database**: SQLite table `query_analytics` inside `data/metadata.db`.
- **Pipeline Integration**: Asynchronously/safely invoked after Step 6 of the orchestrator. If analytics logging encounters any transient filesystem error, it logs the exception and allows normal query responses to proceed uninterrupted.
- **Tracked Metrics**:
  - `query_id`, `conversation_id`, `timestamp`, `query_text`, `query_type`, `domain`, `theme`
  - `resolution_status` (`ANSWERED`, `LOW_CONFIDENCE`, `UNANSWERED`, `CLARIFICATION_REQUIRED`, `ERROR`)
  - `retrieved_documents`, `retrieved_chunks`, `retrieval_scores`, `confidence`, `response_latency`, `input_mode`
  - `knowledge_gap` (boolean flag) and `failure_reason`
- **Knowledge Gap Engine**: Automatically triggers when no candidate chunks meet `SIMILARITY_THRESHOLD` or when retrieved context lacks substantive term overlap with the query.

---

## 7. Conversational Chat UI Architecture (Milestone 4)

- **Legacy Top Search Box Removed**: Completely discarded the old top search form.
- **Top Pinned Header**: Compact `Active Topic` banner with domain tagging and a `New Session` button for session resets.
- **Scrollable Chat Container**: Flexbox container (`flex: 1`, `overflow-y: auto`) that renders continuous message bubbles, auto-scrolling to the latest entry upon arrival.
- **Assistant Response Nodes**: Rich cards embedding grounded markdown text, confidence ratings, audio TTS controls (`Play`, `Pause`, `Resume`, `Stop`), and collapsible evidence provenance panels.
- **Sticky Query Footer**: Fixed to the bottom of the conversation view containing a multi-line input textarea (`Enter` to submit, `Shift+Enter` for newline), Web Speech API microphone dictation button, Top-K evidence count selector, and submit button.


