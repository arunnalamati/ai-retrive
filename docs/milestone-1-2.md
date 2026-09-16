# Academic Technical Documentation: Milestones 1 & 2
## AI Knowledge Retrieval and Multi-Agent RAG System

---

## 1. Introduction: What is RAG?

Retrieval-Augmented Generation (RAG) is an architectural framework that enhances Large Language Models (LLMs) and informational synthesis systems by combining **parametric knowledge** (information ingrained within model weights) with **non-parametric knowledge** (dynamically retrieved external data stores).

In traditional generative approaches, models suffer from:
1. **Hallucinations**: Generative fabrication of plausible-sounding but factually false claims.
2. **Knowledge Latency**: Inability to reflect information created after training cutoff dates.
3. **Lack of Verifiable Provenance**: Absence of citations or confidence metrics linking statements to authoritative sources.

RAG remedies these vulnerabilities by querying an external knowledge base at inference time, extracting the most relevant source passages, and grounding subsequent answers exclusively in verifiable source excerpts.

```
+---------------+     User Query     +-------------------+
|               | -----------------> |   Semantic Vector |
|               |                    |       Search      |
|               |                    +-------------------+
|               |                              |
|   End User    |                              v
|               |                    +-------------------+
|               | <----------------- | Grounded Response |
|               |   Grounded Answer  |     Synthesis     |
+---------------+   + Source Chunks  +-------------------+
```

---

## 2. RAG System Architecture

The end-to-end system is partitioned into two asynchronous workflows:

### A. Document Ingestion Pipeline
1. **File Ingestion**: The system ingests multi-format documents (PDF, DOCX, TXT, CSV).
2. **Text Extraction & Cleaning**: Specialized loaders extract text and apply deterministic filters to remove formatting artifacts and control bytes.
3. **Recursive Chunking**: Documents are split into overlapping semantic units ($S = 700$ characters, $O = 120$ characters) to preserve contextual boundaries.
4. **Vector Embedding**: Dense 384-dimensional vector representations are generated via `all-MiniLM-L6-v2`.
5. **Persistent Vector Store**: Chunks, vectors, and structured metadata (document name, page number, section, timestamp) are committed to a persistent ChromaDB collection.

### B. Query Processing & Multi-Agent Inference Pipeline
1. **Query Understanding Agent**: Analyzes linguistic structure, intent, and referential completeness. Categorizes query into `factual`, `procedural`, `comparative`, or `ambiguous`.
2. **Routing Decision**: Directs ambiguous queries to the `Clarification Agent`, and valid domain queries to the `Retrieval Agent`.
3. **Retrieval Agent**: Vectorizes the user query, queries ChromaDB using Cosine distance, computes normalized relevance scores ($s \in [0, 1]$), and filters out candidates falling below the threshold ($T = 0.35$).
4. **Response Generation Agent**: Grounded synthesis engine that uses retrieved context chunks to construct a factual answer without external hallucinations.
5. **Confidence & Attribution**: Calculates Retrieval Confidence (`High`, `Medium`, `Low`) and binds exact source attributions (document, chunk ID, page number, relevance score).

---

## 3. Embeddings & Semantic Similarity

### Dense Vector Representations
Text cannot be directly compared mathematically without projecting string tokens into a continuous vector space $\mathbb{R}^d$. 
The `all-MiniLM-L6-v2` Sentence-Transformer model maps sentences and paragraphs to a 384-dimensional dense vector space:

$$\mathbf{e} = f_{\theta}(\text{text}) \in \mathbb{R}^{384}, \quad \|\mathbf{e}\|_2 = 1$$

### Cosine Similarity Metric
Because embeddings are unit-normalized ($L_2$ norm = 1), the semantic similarity between a query vector $\mathbf{q}$ and a document chunk vector $\mathbf{d}$ is computed using cosine similarity:

$$\text{Cosine Similarity}(\mathbf{q}, \mathbf{d}) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\|_2 \|\mathbf{d}\|_2} = \sum_{i=1}^{384} q_i d_i$$

ChromaDB represents distance using Cosine Distance:

$$\mathcal{D}_{\text{cosine}}(\mathbf{q}, \mathbf{d}) = 1 - \text{Cosine Similarity}(\mathbf{q}, \mathbf{d})$$

The system converts this into a normalized relevance score:

$$\text{Relevance Score} = \max\left(0.0, \, \min\left(1.0, \, 1.0 - \frac{\mathcal{D}_{\text{cosine}}}{2.0}\right)\right)$$

---

## 4. Chunking Strategies

Splitting documents is crucial because:
- Embedding an entire book into a single 384-dimensional vector dilutes fine-grained semantic nuance.
- Context windows are finite; targeted chunk retrieval ensures high signal-to-noise ratio.

### Configurable Parameters
- **Chunk Size**: $700$ characters. Balances sentence completeness with semantic specificity.
- **Chunk Overlap**: $120$ characters. Ensures thoughts, phrases, and facts spanning chunk boundaries are not truncated.
- **Boundary Preservation**: The chunker prioritizes natural breaks (`\n\n` $\rightarrow$ `\n` $\rightarrow$ `. ` $\rightarrow$ ` `). Empty chunks are discarded, and metadata is preserved across every chunk.

---

## 5. Vector Database: ChromaDB

ChromaDB is an open-source, embeddable vector database optimized for AI development.
- **Index Type**: Hierarchical Navigable Small World (HNSW) graphs, enabling $O(\log N)$ approximate nearest neighbor (ANN) retrieval.
- **Persistence**: Committed to disk under `./data/chroma/`, ensuring indexed vectors persist across server restarts.
- **Atomic Upserts**: Documents and chunks are indexed with unique IDs (`{document_id}_{chunk_id}`) preventing duplicate chunk pollution.

---

## 6. Multi-Agent Architecture & Responsibilities

Rather than a monolithic pipeline, responsibilities are segregated among autonomous, specialized software agents:

| Agent | Core Responsibility | Input | Output |
| :--- | :--- | :--- | :--- |
| **Query Understanding Agent** | Intent classification & routing | User query string | `{query_type, classification_confidence, route}` |
| **Retrieval Agent** | Semantic search & threshold filtering | Query, query type, Top-K | Ranked chunks, relevance scores, `no_sufficient_information` flag |
| **Response Generation Agent** | Grounded synthesis & anti-hallucination | Query, retrieved chunks | Synthesized grounded answer |
| **Clarification Agent** | Ambiguity resolution & prompt guidance | Ambiguous query | Clarification request & suggestion examples |
| **Conversation Memory Agent** | Dialogue state & historical turn storage | Query, response, metadata | Turn buffer for conversational continuity |
| **Multi-Agent Orchestrator** | Sequential pipeline coordination | User query, parameters | Consolidated API response payload |

---

## 7. Web Speech API (Voice & Audio)

To provide an accessible multi-modal interface:
1. **Speech-to-Text (STT)**: Uses the browser's native `webkitSpeechRecognition` / `SpeechRecognition` API. Transcribes spoken voice into text in real-time, inserting the result into the query panel.
2. **Text-to-Speech (TTS)**: Uses `window.speechSynthesis` to vocalize the grounded response when the user clicks **Read Response**.

Both capabilities execute on client hardware with zero additional cloud subscription costs.

---

## 8. Technology Choices & Rationale

- **FastAPI**: Asynchronous Python web framework with native OpenAPI/Swagger docs, high throughput, and strict Pydantic type validation.
- **Sentence-Transformers (`all-MiniLM-L6-v2`)**: Extremely fast, lightweight (80MB), high-performing embedding model running locally on CPU or GPU without requiring external API keys.
- **ChromaDB**: Native Python integration, persistent storage, and HNSW cosine distance indexing.
- **SQLite**: Zero-configuration, ACID-compliant relational metadata store for tracking documents, file paths, chunk totals, and upload timestamps.
- **React + Vite**: Instant Hot Module Replacement (HMR), component-driven UI, and zero build bloat.
- **Pure CSS**: Tailored design system featuring glassmorphic depth, dark mode aesthetics, and micro-animations without external CSS bloat.

---

## 9. Limitations & Future Improvements (Milestone 3 Roadmap)

### Current Limitations (Milestone 1 & 2 Scope)
- Extractive synthesis relies on top-ranked chunks; complex cross-document multi-hop reasoning without an external LLM key is limited.
- Session memory is ephemeral within the server session; persistent multi-user authentication is omitted per academic scope.

### Milestone 3 Roadmap
1. Multi-turn dialogue clarification workflows with user confirmation loops.
2. Hybrid sparse-dense retrieval (BM25 + Dense vector reciprocal rank fusion).
3. Re-ranking agents (e.g. Cross-Encoder rerankers) to reorder initial Top-K candidates.
4. Autonomous agent reflection and iterative retrieval query rewriting.
