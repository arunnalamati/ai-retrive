# Testing & Verification Guide
## AI Knowledge Retrieval and Multi-Agent RAG System

This guide outlines the automated test suite and manual verification test cases.

---

## 1. Automated Test Suite (`pytest`)

Execute all tests from the project root:

```bash
python -m pytest -v
```

### Covered Test Modules:
1. `tests/test_chunking.py`:
   - Text cleaning (removes control characters, collapses whitespace, preserves sentence integrity)
   - Boundary-aware sliding window chunking with configurable overlap
   - Prevention of empty chunks
   - Metadata propagation (`document_id`, `chunk_id`, `page_number`, `section`)
2. `tests/test_embeddings.py`:
   - Embedding dimension validation ($d = 384$)
   - $L_2$ unit normalization ($\|\mathbf{e}\|_2 \approx 1.0$)
   - Batch and single-query embedding consistency
3. `tests/test_retrieval.py`:
   - Cosine semantic similarity indexing and retrieval
   - Top-K parameter enforcement (Top-1, Top-3, Top-5)
   - Multi-domain knowledge separation
   - Relevance threshold filtering
4. `tests/test_query_understanding.py`:
   - Factual classification
   - Procedural classification
   - Comparative classification
   - Ambiguous classification and routing to `clarification_required`
5. `tests/test_api.py`:
   - `/health` endpoint status
   - `/upload` multipart ingestion
   - `/documents` catalog retrieval
6. `tests/test_clarification_agent.py`:
   - Ambiguity detection across pronouns, vague fees, and missing referents
   - Targeted follow-up question generation
   - Safe bypassing for confident factual queries
   - Refined query synthesis from user clarification
   - Multi-part query decomposition
7. `tests/test_conversation_memory_agent.py`:
   - Session tracking and history storage
   - Coreference resolution (*"What are its main steps?"* $\rightarrow$ RAG)
   - Context continuation (*"What about the renewal period?"* $\rightarrow$ College Library Policy)
   - Context switching isolation (*"What is RAG?"* $\rightarrow$ *"How many books can students borrow?"*)
   - Pending clarification lifecycle
8. `tests/test_orchestrator_m3.py`:
   - Multi-agent orchestration for ambiguous queries and refinement
   - Multi-part query execution across multiple policy chunks
   - Transparency panel payload generation and supporting chunk audit
   - Zero hallucination on out-of-domain queries (*"What is the hostel fee?"*)

---

## 2. Validation Test Cases Matrix (Milestone 3)

| Test ID | Query / Interaction | Agent Action | Expected Route | Knowledge Domain | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST 1** | *"How long can I keep it?"* $\rightarrow$ *"library books"* | Clarification Agent $\rightarrow$ Refine Query $\rightarrow$ Retrieval | `clarification_required` $\rightarrow$ `retrieval` | `College_Library_Policy.txt` | Asks targeted question: *"Are you asking about the borrowing period for library books?"* User clarifies: *"library books"*. Answers: *"Books are issued for a period of 14 days."* |
| **TEST 2** | *"What is RAG?"* then *"What are its main steps?"* | Conversation Memory Agent | `retrieval` | `AI_RAG_Guide.txt` | Turn 1 answers RAG. Turn 2 resolves *"its"* $\rightarrow$ *"RAG"* without requiring user repetition. |
| **TEST 3** | *"What is RAG?"* then *"How many books can a student borrow?"* | Conversation Memory Agent | `retrieval` | `College_Library_Policy.txt` | Switches domain context cleanly to College Library Policy without mixing RAG context. Answers: 4 books. |
| **TEST 4** | *"How many books can I borrow and what is the late return fine?"* | Clarification Agent + Retrieval Agent | `retrieval` | `College_Library_Policy.txt` | Decomposes multi-part query, retrieves both Book Borrowing and Late Returns. Answers both: 4 books, 2 rupees/day. |
| **TEST 5** | Voice Input via Microphone | Web Speech API | `retrieval` | Any indexed doc | Transcribes voice to text in search input for user review before submission. |
| **TEST 6** | Read Response Button | Web Speech Synthesis | N/A | UI audio | Reads AI generated answer aloud with Play, Pause, Resume, Stop controls. |
| **TEST 7** | *"How many books can a student borrow?"* | Response Transparency Panel | `retrieval` | `College_Library_Policy.txt` | Shows answer, confidence (HIGH), expandable supporting evidence chunk, document name, section, and relevance score. |
| **TEST 8** | *"What is the hostel fee?"* | Anti-Hallucination + Transparency | `retrieval` | None | Low confidence, returns *"I couldn't find sufficient information in the knowledge base."*, transparency shows no sufficiently relevant chunks found. |

