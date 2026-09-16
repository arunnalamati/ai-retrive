# Multi-Agent RAG System: Agent Specifications

This document defines the roles, input/output schemas, and coordination protocols of the multi-agent architecture.

---

## 1. Query Understanding Agent
- **File**: `backend/agents/query_understanding_agent.py`
- **Purpose**: Evaluates linguistic structure, query semantics, and intent clarity.
- **Classification Categories**:
  - `factual`: Inquiries seeking explicit facts, definitions, metrics, or entities (e.g., *"What is RAG?"*, *"How many annual leave days does an employee receive?"*).
  - `procedural`: Inquiries asking for sequential processes or instructions (e.g., *"What are the steps in a RAG pipeline?"*, *"How do I upload a document?"*).
  - `comparative`: Inquiries seeking comparative distinctions between concepts or agents (e.g., *"What is the difference between the Retrieval Agent and Response Generation Agent?"*).
  - `ambiguous`: Inquiries lacking referential context or containing dangling pronouns (e.g., *"How does it work?"*, *"Tell me more"*).
- **Routing**:
  - `factual`, `procedural`, `comparative` $\rightarrow$ `retrieval`
  - `ambiguous` $\rightarrow$ `clarification_required`

---

## 2. Retrieval Agent
- **File**: `backend/agents/retrieval_agent.py`
- **Purpose**: Semantic vector search, ranking, and relevance threshold enforcement.
- **Workflow**:
  1. Computes query embedding with `all-MiniLM-L6-v2`.
  2. Executes Cosine Distance search in ChromaDB.
  3. Translates distance $\mathcal{D}$ to relevance score $s = 1 - \frac{\mathcal{D}}{2}$.
  4. Filters candidates against threshold (default: $0.35$).
  5. If no candidate exceeds the threshold, sets `no_sufficient_information = True`.

---

## 3. Response Generation Agent
- **File**: `backend/agents/response_generation_agent.py`
- **Purpose**: Grounded answer synthesis without hallucination.
- **Dual Synthesis Modes**:
  - **Extractive Grounded Synthesis (Default, No API Key Required)**: Analyzes retrieved chunks, extracts relevant sentences, and formats a coherent answer. If key query entities are absent from context, returns safe refusal: *"I couldn't find sufficient information in the knowledge base to answer this question."*
  - **External LLM Synthesis (Optional)**: If `LLM_API_KEY` is provided, constructs strict grounded prompt and queries the model with zero-temperature setting.

---

## 4. Clarification Agent
- **File**: `backend/agents/clarification_agent.py`
- **Purpose**: Guides users when queries are ambiguous, providing constructive suggestions and concrete domain query examples.

---

## 5. Conversation Memory Agent
- **File**: `backend/agents/conversation_memory_agent.py`
- **Purpose**: Foundational component that records conversational turns, query classifications, and response confidence for session continuity.

---

## 6. Multi-Agent Orchestrator
- **File**: `backend/agents/orchestrator.py`
- **Purpose**: Directs execution flow between agents, benchmarks execution latency, computes application-level confidence, compiles source attributions, and returns the unified API response.
