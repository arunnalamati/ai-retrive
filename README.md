<<<<<<< HEAD
# AI Knowledge Retrieval and Multi-Agent RAG System

An academic, full-stack multi-agent Retrieval-Augmented Generation (RAG) system implementing **Milestone 1** (Document Ingestion, Cleaning, Chunking, Vector Embeddings, Persistent ChromaDB) and **Milestone 2** (Query Understanding Agent, Retrieval Agent, Response Generation Agent, Clarification Agent, Confidence Estimation, Source Attribution, Web Speech Voice Input, and Modern React Dashboard).

---

## 1. Project Objective & Problem Statement

### Problem Statement
Standard Large Language Models generate text based exclusively on static parametric weights. Consequently, they hallucinate unsupported facts, cannot access private organizational records, lack citation provenance, and cannot verify whether context is sufficient to answer an inquiry.

### Solution
This project implements a modular, grounded Multi-Agent RAG System that:
1. Ingests heterogeneous corporate and academic documents (PDF, DOCX, TXT, CSV).
2. Converts textual chunks into dense semantic vector representations using local Sentence-Transformers.
3. Indexes chunks inside a persistent vector database (ChromaDB) with metadata.
4. Leverages specialized agents (Query Understanding, Retrieval, Clarification, Response Generation, Memory) to analyze intent, perform semantic vector retrieval, enforce relevance thresholds, and construct grounded answers with zero hallucination.
5. Employs Web Speech API for bi-directional speech recognition and text-to-speech synthesis.

---

## 2. Key Features

- **Multi-Format Ingestion**: Supports `.pdf` (pypdf), `.docx` (python-docx), `.txt` (UTF-8), and `.csv` (pandas).
- **Boundary-Aware Chunking**: Configurable character chunking (700 chars, 120 overlap) that respects paragraph and sentence breaks.
- **Local Dense Embeddings**: `all-MiniLM-L6-v2` generating 384-dimensional unit-normalized embeddings locally with zero external API fees.
- **Persistent Vector Store**: ChromaDB storage persisted to disk under `data/chroma/`.
- **Multi-Agent Orchestration**:
  - **Query Understanding Agent**: Classifies queries into `factual`, `procedural`, `comparative`, or `ambiguous`.
  - **Retrieval Agent**: Semantic vector search with cosine similarity, Top-K ranking, and threshold filtering.
  - **Response Generation Agent**: Grounded synthesis ensuring strict attribution and zero hallucination.
  - **Clarification Agent**: Resolves ambiguous inquiries with constructive guidance.
  - **Conversation Memory Agent**: Foundations for session turn tracking.
- **Strict Anti-Hallucination**: Returns clear no-information state when retrieved evidence is absent.
- **Retrieval Confidence Scoring**: Quantifies retrieval confidence as `High`, `Medium`, or `Low` based on vector distances.
- **Verifiable Source Attribution**: Displays document name, chunk ID, relevance percentage, and page/section.
- **Multi-Modal Voice Interaction**: Web Speech API speech-to-text recognition and text-to-speech synthesis.
- **Modern AI Dashboard**: Dark-mode glassmorphic interface with real-time pipeline status animations.

---

## 3. Technology Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic v2
- **Document Processing**: pypdf, python-docx, pandas
- **Vector Store & Embeddings**: ChromaDB, Sentence-Transformers (`all-MiniLM-L6-v2`)
- **Metadata Database**: SQLite 3 (`data/metadata.db`)
- **Frontend**: React 19, Vite, JavaScript, HTML5, Vanilla CSS Design System
- **Voice**: Web Speech API (`SpeechRecognition` & `speechSynthesis`)
- **Testing**: pytest

---

## 4. Project Structure

```
ai-knowledge-rag/
│
├── backend/
│   ├── __init__.py
│   ├── main.py                     # FastAPI server & route registration
│   ├── config.py                   # Pydantic environment configuration
│   ├── utils.py                    # Common utility helpers
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── upload.py               # POST /upload endpoint
│   │   ├── query.py                # POST /query endpoint
│   │   └── documents.py            # GET /documents, GET /stats endpoints
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── query_understanding_agent.py   # Query classifier & router
│   │   ├── retrieval_agent.py             # Semantic search & ranking
│   │   ├── response_generation_agent.py   # Grounded response synthesizer
│   │   ├── clarification_agent.py         # Ambiguity handler
│   │   ├── conversation_memory_agent.py   # Session turn tracker
│   │   └── orchestrator.py                # Multi-agent coordinator
│   │
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── document_loader.py      # Format router
│   │   ├── pdf_loader.py           # pypdf reader
│   │   ├── docx_loader.py          # python-docx reader
│   │   ├── txt_loader.py           # UTF-8 text reader
│   │   ├── csv_loader.py           # pandas tabular reader
│   │   └── cleaner.py              # Text normalization & sanitation
│   │
│   ├── chunking/
│   │   ├── __init__.py
│   │   └── text_chunker.py         # Sliding window chunker
│   │
│   ├── embeddings/
│   │   ├── __init__.py
│   │   └── embedding_service.py    # SentenceTransformer singleton
│   │
│   ├── vectorstore/
│   │   ├── __init__.py
│   │   └── chroma_service.py       # Persistent ChromaDB client
│   │
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── retrieval.py            # Search & threshold filtering
│   │   ├── prompt_builder.py       # Strict grounding prompt builder
│   │   └── confidence.py           # Retrieval confidence calculation
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── document_models.py      # Upload & metadata schemas
│   │   ├── query_models.py         # Query schemas
│   │   └── response_models.py      # Output & source attribution schemas
│   │
│   └── database/
│       ├── __init__.py
│       └── database.py             # SQLite document tracking
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Dashboard.jsx
│       │   ├── UploadPanel.jsx
│       │   ├── DocumentList.jsx
│       │   ├── QueryPanel.jsx
│       │   ├── QueryAnalysis.jsx
│       │   ├── RetrievalResults.jsx
│       │   ├── ResponsePanel.jsx
│       │   ├── Sources.jsx
│       │   ├── AgentPipeline.jsx
│       │   ├── ConfidenceBadge.jsx
│       │   └── VoiceInput.jsx
│       └── services/
│           └── api.js              # Centralized Axios/fetch service
│
├── tests/
│   ├── __init__.py
│   ├── test_chunking.py
│   ├── test_embeddings.py
│   ├── test_retrieval.py
│   ├── test_query_understanding.py
│   └── test_api.py
│
├── data/
│   ├── uploads/                    # Uploaded document storage
│   ├── chroma/                     # ChromaDB persistent files
│   └── sample_documents/           # Test documents
│       ├── AI_RAG_Guide.txt
│       └── Employee_Leave_Policy.txt
│
├── docs/
│   ├── milestone-1-2.md
│   ├── architecture.md
│   ├── agents.md
│   ├── api.md
│   └── testing.md
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 5. Installation & Setup

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: 18+ (tested on Node v26)
- **npm**: 9+

### Backend Setup
1. Clone or navigate into the project directory:
   ```bash
   cd "AI RETRIVE"
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
4. Configure environment (optional, works out-of-the-box without keys):
   ```bash
   copy .env.example .env
   ```

### Frontend Setup
1. Navigate into `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

---

## 6. Running the System

### Start Backend Server
In the project root with the virtual environment activated:
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
- **Backend API**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

### Start Frontend Application
In a separate terminal, inside `frontend/`:
```bash
npm run dev
```
- **Frontend URL**: `http://localhost:5173`

---

## 7. How to Use the Application

1. **Check Backend Status**: Observe the green `● Backend Connected` indicator in the top header.
2. **Upload Documents**:
   - Go to the **Knowledge Base** section.
   - Drag and drop or click **Choose Document** to select a document (`AI_RAG_Guide.txt`, `Employee_Leave_Policy.txt`, or any PDF, DOCX, TXT, CSV).
   - Click **Upload & Index**.
   - Review extracted chunks in the Indexed Documents list.
3. **Ask Questions**:
   - Switch to **Ask AI**.
   - Type a question or click the 🎤 **Mic button** to dictate via Web Speech API.
   - Select desired **Top K** (1, 3, or 5).
   - Click **Ask AI**.
4. **Inspect Pipeline & Results**:
   - **Agent Pipeline**: Watch the visual workflow transition from Query Understanding $\rightarrow$ Retrieval $\rightarrow$ Response Generation.
   - **Query Understanding**: View classified Query Type (`factual`, `procedural`, etc.), confidence score, and routing.
   - **Retrieved Knowledge**: Examine individual chunk cards, relevance score meters, and text excerpts.
   - **AI Response**: Read the grounded answer, click 🔊 **Read Response** for audio playback, inspect Retrieval Confidence and source attributions.

---

## 8. Example Validation Queries

1. **Factual Inquiry**:
   - *Query*: `What is RAG?`
   - *Expected*: Factual intent, retrieves definition from `AI_RAG_Guide.txt`, High confidence.
2. **Procedural Workflow**:
   - *Query*: `What are the steps in a RAG pipeline?`
   - *Expected*: Procedural intent, extracts sequential pipeline steps 1 through 8.
3. **Comparative Analysis**:
   - *Query*: `What is the difference between the Retrieval Agent and Response Generation Agent?`
   - *Expected*: Comparative intent, contrasts search/ranking vs. grounded answer generation.
4. **Ambiguous Query**:
   - *Query*: `How does it work?`
   - *Expected*: Ambiguous intent, routed to `clarification_required`, prompts user for specific topic.
5. **Out-of-Domain / Negative Query**:
   - *Query*: `What is the company's maternity leave policy?`
   - *Expected*: Zero hallucination. Returns: *"I couldn't find sufficient information in the knowledge base to answer this question."* with Low confidence.
6. **Domain Separation**:
   - *Query*: `How many annual leave days does an employee receive?`
   - *Expected*: Factual intent, retrieves 24 days from `Employee_Leave_Policy.txt`.

---

## 9. Running Automated Tests

Run the full pytest suite:
```bash
python -m pytest -v
```

---

## 10. Scope & Roadmap

- **Milestone 1**: Complete document ingestion, chunking, embeddings, ChromaDB, vector search.
- **Milestone 2**: Multi-agent pipeline (Query Understanding, Retrieval, Response Generation, Clarification, Memory), grounded synthesis, confidence scoring, source attribution, Web Speech voice input, modern dashboard.
- **Milestone 3 (Future Scope)**: Multi-turn iterative clarification workflows, hybrid BM25 + dense retrieval, re-ranking cross-encoders, and agentic self-reflection.
=======
# ai-retrive
>>>>>>> 79aca356f7fc85f06d2c77118cd1fc15613cb8e1
