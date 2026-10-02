# Multi-Agent RAG System: Agent Specifications

This document defines the roles, input/output schemas, and coordination protocols of the multi-agent architecture.

---

## 1. Query Understanding Agent
- **File**: `backend/agents/query_understanding_agent.py`
- **Purpose**: Evaluates linguistic structure, query semantics, and intent clarity.
- **Classification Categories**:
  - `factual`: Inquiries seeking explicit facts, definitions, metrics, or entities (e.g., *"How many books can an undergraduate student borrow?"*, *"What is the hostel caution deposit?"*).
  - `procedural`: Inquiries asking for sequential processes or instructions (e.g., *"What is the step-by-step book renewal procedure?"*, *"How do I apply for revaluation?"*).
  - `comparative`: Inquiries seeking comparative distinctions between concepts, categories, or policies (e.g., *"Compare undergraduate vs postgraduate borrowing limits"*).
  - `ambiguous`: Inquiries lacking referential context or containing dangling pronouns without domain nouns (e.g., *"How long can I keep it?"*, *"rules"*, *"policy"*).
  - `multi_part`: Compound inquiries joined by coordinating conjunctions (e.g., *"What are dinner mess timings and what is the penalty for electrical appliances?"*).
  - `follow_up`: Inquiries that rely on multi-turn context continuation (e.g., *"What about renewal?"*, *"What about its refund?"*).
- **Routing**:
  - `factual`, `procedural`, `comparative`, `multi_part`, `follow_up` $\rightarrow$ `retrieval`
  - `ambiguous` $\rightarrow$ `clarification_required`

---

## 2. Retrieval Agent
- **File**: `backend/agents/retrieval_agent.py`
- **Purpose**: Semantic vector search, ranking, and relevance threshold enforcement.
- **Workflow**:
  1. Computes query embedding with `all-MiniLM-L6-v2`.
  2. Executes Cosine Distance search in ChromaDB.
  3. Translates distance $\mathcal{D}$ to relevance score $s = 1 - \frac{\mathcal{D}}{2}$.
  4. Filters candidates against threshold (`settings.RETRIEVAL_THRESHOLD`, default: $0.35$).
  5. Supports multi-part decomposed subqueries and aggregates unique candidate chunks.
  6. If no candidate exceeds the threshold, sets `no_sufficient_information = True`.

---

## 3. Response Generation Agent
- **File**: `backend/agents/response_generation_agent.py`
- **Purpose**: Grounded answer synthesis without hallucination.
- **Topical Overlap Guard**: Filters out vector false-positives by verifying query substantive keywords against candidate chunk content.
- **Dual Synthesis Modes**:
  - **Extractive Grounded Synthesis (Default, No API Key Required)**: Analyzes retrieved chunks, extracts relevant sentences, and formats a coherent answer. If key query entities are absent from context, returns safe refusal: *"I couldn't find sufficient information in the knowledge base to answer this question."*
  - **External LLM Synthesis (Optional)**: If `LLM_API_KEY` is provided, constructs strict grounded prompt and queries the model with zero-temperature setting.

---

## 4. Clarification Agent (Milestone 3.1 & 4.3)
- **File**: `backend/agents/clarification_agent.py`
- **Purpose**: Detects ambiguous, incomplete, context-dependent queries and formulates targeted follow-up prompts.
- **Capabilities**:
  - **Ambiguity Detection**: Flags pronouns without referents (*"it"*, *"its"*, *"that document"*), underspecified quantities/items (*"How much can I borrow?"*), and isolated keywords (*"rules"*, *"policy"*).
  - **Targeted Question Formulation**: Asks context-specific follow-ups (e.g. *"Are you asking about the borrowing period for library books?"*, *"Which domain rules are you referring to — College Library, Hostel Accommodation, or Examination Policy?"*).
  - **Multi-Part Query Decomposition**: Splits compound queries to retrieve evidence for each sub-intent.
  - **Refined Query Synthesis**: Fuses original query and user clarification into a fully qualified inquiry for retrieval.

---

## 5. Conversation Memory Agent (Milestone 3.2 & 4.3)
- **File**: `backend/agents/conversation_memory_agent.py`
- **Purpose**: Maintains session-scoped interaction history, resolves coreference, and handles topic continuity.
- **Multi-Domain Context Switching**:
  - Automatically isolates Library, Hostel, and Examination domain context across dialogue turns.
  - Resolves pronouns accurately within active domain without cross-pollinating terms.
  - Strict isolation: Conversation memory remains in-process and is **never** written to ChromaDB.

---

## 6. Multi-Agent Orchestrator
- **File**: `backend/agents/orchestrator.py`
- **Purpose**: Directs the end-to-end multi-agent execution pipeline:
  `Memory Context Resolution` $\rightarrow$ `Clarification Evaluation` $\rightarrow$ `Query Understanding` $\rightarrow$ `Retrieval` $\rightarrow$ `Response Generation` $\rightarrow$ `Transparency Panel Assembly` $\rightarrow$ `Memory Update` $\rightarrow$ `Query Analytics Logging & Gap Detection`.

---

## 7. Query Analytics Subsystem (Milestone 4.1)
- **File**: `backend/database/analytics_db.py`
- **Purpose**: Records real-time telemetry for every interaction into persistent SQLite storage:
  - Tracks query text, intent type, domain, theme, retrieval scores, confidence, response latency, and input mode (`text` or `voice`).
  - Detects **Knowledge Gaps** when questions cannot be answered from indexed institutional data.
  - Non-blocking design: Failures in analytics logging never crash or delay query responses.
