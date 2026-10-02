# Milestone 4.1: Query Analytics & Knowledge Gap Detection

## 1. Overview
The Query Analytics subsystem in Milestone 4 provides deep observability into the Multi-Agent RAG pipeline. It records real-time metrics for every user query—whether submitted via text or speech—into a dedicated persistent SQLite database (`data/metadata.db`), completely segregated from ChromaDB vector representations.

The system automatically identifies queries that the knowledge base cannot ground, detects **Knowledge Gaps**, classifies recurring inquiry themes, measures end-to-end response latency, and computes empirical confidence distributions.

---

## 2. Persistent Schema (`query_analytics`)

Every incoming query is tracked with strict type integrity:

| Field | Type | Description |
|---|---|---|
| `query_id` | `TEXT PRIMARY KEY` | Unique UUID v4 assigned to each individual query interaction |
| `conversation_id` | `TEXT` | Session identifier linking multi-turn queries |
| `timestamp` | `TEXT NOT NULL` | ISO-8601 UTC timestamp of query execution |
| `query_text` | `TEXT NOT NULL` | Raw user question or voice transcription |
| `query_type` | `TEXT NOT NULL` | Intent classification (`factual`, `procedural`, `comparative`, `ambiguous`, `multi_part`, `follow_up`) |
| `domain` | `TEXT` | Knowledge domain (`College Library Policy`, `Hostel / Student Accommodation Policy`, `Academic / Examination Policy`, `General`) |
| `theme` | `TEXT` | Recurring thematic subject (`Book Borrowing`, `Book Renewal`, `Hostel Refund`, `Curfew Timings`, `Attendance`, `Revaluation`, etc.) |
| `resolution_status` | `TEXT NOT NULL` | `ANSWERED`, `LOW_CONFIDENCE`, `UNANSWERED`, `CLARIFICATION_REQUIRED`, `ERROR` |
| `clarification_required` | `INTEGER` | 1 if clarification agent intercepted, 0 otherwise |
| `clarification_count` | `INTEGER` | Number of clarification turns in this interaction |
| `retrieved_documents` | `TEXT` | JSON array of filenames supplying candidate chunks |
| `retrieved_chunks` | `INTEGER` | Total number of valid evidence chunks retrieved |
| `retrieval_scores` | `TEXT` | JSON array of float cosine similarity scores |
| `confidence` | `TEXT NOT NULL` | Categorical confidence level (`High`, `Medium`, `Low`, `None`) |
| `response_latency` | `REAL NOT NULL` | End-to-end execution time in milliseconds |
| `input_mode` | `TEXT NOT NULL` | Origin mode (`text` or `voice`) |
| `generated_response` | `TEXT` | Grounded synthesized assistant answer or refusal statement |
| `knowledge_gap` | `INTEGER NOT NULL` | 1 if query represents an ungrounded domain topic, 0 otherwise |
| `failure_reason` | `TEXT` | Root diagnostic explanation when query is ungrounded or ambiguous |

---

## 3. Knowledge Gap Detection

Knowledge Gaps represent questions where the system correctly determines that institutional records do not contain the answer, avoiding false hallucination.

### Gap Trigger Conditions:
1. **Empty Vector Search**: Zero chunks retrieved from ChromaDB matching query embedding.
2. **Sub-Threshold Relevance**: Top candidate chunks score below `settings.SIMILARITY_THRESHOLD` (0.35).
3. **Low Confidence & Ungrounded Content**: No topical term overlap between query subject and retrieved document text.
4. **Refusal Statement**: Extractive synthesis generator outputs grounded refusal `"I couldn't find sufficient information in the knowledge base to answer this question."`

### Diagnostic Trace Example:
- **User Query**: `"What is the hostel refund policy?"` (when only library docs loaded)
- **Status**: `UNANSWERED`
- **Knowledge Gap**: `TRUE`
- **Failure Reason**: `"No relevant chunks above similarity threshold (0.35) found in knowledge base."`
- **Confidence**: `Low`

---

## 4. Analytics REST API Endpoints

The FastAPI backend exposes comprehensive analytical endpoints at `/analytics/*`:

| Endpoint | Method | Query Parameters | Description |
|---|---|---|---|
| `/analytics/summary` | `GET` | `domain` | High-level KPI aggregations (total, answered, unanswered, gaps, latency, confidence) |
| `/analytics/queries` | `GET` | `domain`, `query_type`, `status`, `min_confidence`, `limit` | Paginated raw interaction logs with full metadata |
| `/analytics/unanswered` | `GET` | `domain`, `limit` | Queries that could not be grounded by the knowledge base |
| `/analytics/knowledge-gaps` | `GET` | `domain`, `limit` | Explicit domain knowledge deficiencies |
| `/analytics/themes` | `GET` | `domain` | Aggregated counts of recurring inquiry themes |
| `/analytics/confidence` | `GET` | `domain` | Confidence tier distribution (`High`, `Medium`, `Low`) |
| `/analytics/types` | `GET` | `domain` | Distribution of queries across the 6 intent classifications |
| `/analytics/trends` | `GET` | `domain`, `days` | Daily inquiry volume and resolution performance trends |

---

## 5. Analytics Dashboard UI

Located under the **Analytics** navigation tab in the React frontend:
- **KPI Metrics Cards**: Total Queries, Answered Rate, Unanswered Queries, Knowledge Gaps, Clarification Trigger Count, Average Confidence, Average Response Time.
- **Interactive Filtering Bar**: Filter real-time analytics by Domain, Query Type, and Status.
- **Distribution Charts**:
  - Breakdown by Knowledge Domain (Library vs Hostel vs Exam).
  - Breakdown by Query Intent Type.
  - Confidence Distribution (High vs Medium vs Low).
  - Common Query Themes list with frequency counts.
- **Interactive Tables**:
  - Recent Queries log with timestamp, latency, status badges, and source previews.
  - Knowledge Gaps inspection table with diagnostic failure reasons.
