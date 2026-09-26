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

## 4. Clarification Agent (Milestone 3.1)
- **File**: `backend/agents/clarification_agent.py`
- **Purpose**: Detects ambiguous, incomplete, context-dependent queries and formulates targeted follow-up prompts.
- **Capabilities**:
  - **Ambiguity Detection**: Flags pronouns without referents (*"it"*, *"its"*, *"that document"*), underspecified quantities/items (*"How much can I borrow?"*), and vague operations (*"how does it work?"*).
  - **Targeted Question Formulation**: Asks context-specific follow-ups (e.g. *"Are you asking about the borrowing period for library books?"*, *"What would you like to borrow — library books or something else?"*).
  - **Multi-Part Query Decomposition**: Splits compound queries (e.g. *"How many books can I borrow and what is the late return fine?"*) to retrieve evidence for each sub-intent.
  - **Refined Query Synthesis**: Fuses original query and user clarification into a fully qualified inquiry for retrieval (e.g. *"Library book"* $\rightarrow$ *"How long can a student keep a borrowed library book?"*, *"Books."* $\rightarrow$ *"How many books can a student borrow?"*).
  - **Clarification State Model**:
    - `conversation_id`: Associated session UUID.
    - `original_query`: Original input query.
    - `clarification_required`: Boolean flag.
    - `clarification_question`: Formulated follow-up prompt.
    - `missing_context`: Summary of missing parameters.
    - `awaiting_clarification`: `true` while awaiting response; `false` once clarified.
    - `clarification_response`: Captured user response.
    - `refined_query`: Synthesized query sent to retrieval.

---

## 5. Conversation Memory Agent (Milestone 3.2)
- **File**: `backend/agents/conversation_memory_agent.py`
- **Purpose**: Maintains session-scoped interaction history, resolves coreference, and handles topic continuity.
- **Capabilities**:
  - **Coreference Resolution**: Resolves pronouns like *"its"* $\rightarrow$ *"RAG"* using conversation history (*"What are its main steps?"* $\rightarrow$ *"What are the main steps in the RAG pipeline?"*).
  - **Context Continuation**: Preserves topical domain for elliptical follow-ups (*"What about renewal?"* $\rightarrow$ *"What is the renewal period for borrowed library books?"*).
  - **Clean Context Switching**: Detects topic shifts (e.g. transitioning from *RAG Architecture* to *College Library Policy*) and prevents blending stale context into new domains.
  - **Vector Store Isolation**: Memory remains in session storage and is **never** saved as permanent ChromaDB knowledge chunks.
  - **Memory Context Model (`MemoryContext`)**:
    - `topic`: Current conversational topic.
    - `entities`: Recognized key entities across turns (`Library Books`, `Borrowing Policy`, `Late Return Fine`, `RAG Architecture`, etc.).
    - `referenced_documents`: Files cited during the session.
    - `relevant_previous_queries`: Recent user questions.
    - `relevant_previous_answers`: Recent AI responses.
    - `clarification_context`: Active or resolved clarification state.

---

## 6. Multi-Agent Orchestrator
- **File**: `backend/agents/orchestrator.py`
- **Purpose**: Directs the end-to-end multi-agent execution pipeline:
  `Memory Context Resolution` $\rightarrow$ `Clarification Evaluation (if ambiguous)` $\rightarrow$ `Query Understanding` $\rightarrow$ `Retrieval (with subquery support)` $\rightarrow$ `Response Generation` $\rightarrow$ `Transparency Panel Assembly` $\rightarrow$ `Memory Update`.


