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
   - `/query` end-to-end multi-agent execution

---

## 2. Validation Test Cases Matrix

| Test ID | Query | Expected Classification | Expected Route | Knowledge Domain | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST 1** | *"What is RAG?"* | `factual` | `retrieval` | `AI_RAG_Guide.txt` | Grounded definition of RAG combining retrieval and generation; High/Medium confidence; Source: AI_RAG_Guide.txt |
| **TEST 2** | *"What are the steps in a RAG pipeline?"* | `procedural` | `retrieval` | `AI_RAG_Guide.txt` | Sequential enumerated steps 1 through 8 |
| **TEST 3** | *"What is the difference between the Retrieval Agent and Response Generation Agent?"* | `comparative` | `retrieval` | `AI_RAG_Guide.txt` | Explains Retrieval Agent searches/ranks chunks, while Response Generation Agent creates grounded answer |
| **TEST 4** | *"How does it work?"* | `ambiguous` | `clarification_required` | N/A | Clarification Agent requests specific topic without hallucinating or running vector search |
| **TEST 5** | *"What is the company's maternity leave policy?"* | `factual` | `retrieval` | `Employee_Leave_Policy.txt` | Zero hallucination: *"I couldn't find sufficient information in the knowledge base to answer this question."* Confidence: Low |
| **TEST 6** | *"How many annual leave days does an employee receive?"* | `factual` | `retrieval` | `Employee_Leave_Policy.txt` | Extracts *"24 days of annual leave per calendar year"*; Source: Employee_Leave_Policy.txt |
