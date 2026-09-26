# Milestone 3: Advanced Agentic Dialogue, Memory, Multimodality & Transparency

---

## Architectural Progression & Evolution

| Milestone | Pipeline Pattern | Core Focus |
|---|---|---|
| **Milestone 1** | **Documents $\rightarrow$ Knowledge** | PDF, DOCX, TXT, CSV ingestion, text cleaning, boundary chunking, SentenceTransformer 384-d vector embeddings, ChromaDB vector storage, metadata tracking. |
| **Milestone 2** | **Query $\rightarrow$ Retrieve $\rightarrow$ Generate** | Query Understanding Agent (factual, procedural, comparative, ambiguous), Top-K semantic retrieval, relevance scoring, anti-hallucination thresholding, grounded response generation, source attribution. |
| **Milestone 3** | **Conversation $\rightarrow$ Clarification $\rightarrow$ Memory $\rightarrow$ Voice $\rightarrow$ Transparency** | Proactive Clarification Agent, Conversation Memory Agent with coreference resolution and context continuation, Browser Web Speech API voice input, SpeechSynthesis Text-to-Speech, Response Transparency Panel, Multi-part query decomposition. |

---

## 1. Clarification Agent (`backend/agents/clarification_agent.py`)

### Responsibilities:
1. **Ambiguity & Incompleteness Detection**: Evaluates incoming queries for missing referents, vague pronouns (*"it"*, *"its"*, *"that"*, *"the fee"*, *"how does it work?"*, *"how long can I keep it?"*, *"how much can I borrow?"*).
2. **Clarification Decision Engine**: Checks whether active conversation context already disambiguates the referent. If the referent is already clear from context, clarification is bypassed.
3. **Targeted Follow-up Formulation**: Generates concise, focused questions for missing information without asking redundant or speculative questions.
4. **Structured State Management**:
   ```json
   {
     "conversation_id": "session-uuid",
     "original_query": "How long can I keep it?",
     "clarification_required": true,
     "clarification_question": "Are you asking about the borrowing period for library books?",
     "awaiting_clarification": true
   }
   ```
5. **Conversational Query Refinement**:
   Combines `original_query` + `user_clarification` + memory context into a refined query:
   ```json
   {
     "conversation_id": "session-uuid",
     "original_query": "How long can I keep it?",
     "clarification_response": "Library book",
     "refined_query": "How long can a student keep a borrowed library book?",
     "awaiting_clarification": false
   }
   ```
6. **Multi-Part Decomposition**: Decomposes compound queries with coordinating conjunctions (e.g., *"How many books can I borrow and what is the late return fine?"*) to retrieve evidence for all sub-intents.

---

## 2. Conversation Memory Agent (`backend/agents/conversation_memory_agent.py`)

### Responsibilities:
1. **Session-Scoped History**: Maintains multi-turn interaction turns, timestamps, roles, and confidence ratings per `conversation_id`.
2. **Coreference Resolution**: Anaphoric pronouns are resolved using recent turns:
   - User: *"What is RAG?"* $\rightarrow$ Assistant explains RAG.
   - User: *"What are its main steps?"* $\rightarrow$ Resolves *"its"* to *"RAG"* (*"What are the main steps in the RAG pipeline?"*).
3. **Context Continuation**: Elliptical follow-ups inherit domain context:
   - User: *"How many books can I borrow?"* $\rightarrow$ Assistant: *"4 books."*
   - User: *"What about renewal?"* $\rightarrow$ Resolves to *"What is the renewal period for borrowed library books?"*
4. **Context Switching**: Dynamically transitions when new domain entities are detected (e.g., switching from *RAG Architecture* to *College Library Policy*) without vector cross-contamination.
5. **Memory Context Model (`MemoryContext`)**:
   - `topic`: Currently active domain topic.
   - `entities`: Recognized key entities (e.g. `Library Books`, `Borrowing Policy`, `Late Return Fine`, `RAG Architecture`).
   - `referenced_documents`: Files cited in the session.
   - `relevant_previous_queries`: Recent user questions.
   - `relevant_previous_answers`: Recent AI responses.
   - `clarification_context`: Active or resolved clarification state.
6. **Strict Vector Store Isolation**: Conversation memory is maintained in session memory; it is **never** written into the permanent ChromaDB document index.

---

## 3. Voice Input (`frontend/src/components/VoiceInput.jsx`)

### Responsibilities:
1. **Browser-Based Speech Recognition**: Uses standard Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
2. **Voice Controls**: Microphone toggle button with states (`Idle`, `Listening`, `Processing`, `Voice Error`).
3. **Visible Transcription**: Real-time interim and final speech transcription directly populated in the search bar.
4. **Clear & Edit Controls**: Dedicated *"Clear"* button allows users to review, edit, or clear transcription before execution.
5. **User-Friendly Error Handling**:
   - Permission Denied: *"Microphone permission is required."*
   - Unsupported Browser: *"Speech recognition is not supported in this browser."*

---

## 4. Text-to-Speech (`frontend/src/components/TextToSpeech.jsx`)

### Responsibilities:
1. **Speech Synthesis**: Utilizes browser `window.speechSynthesis` with `SpeechSynthesisUtterance`.
2. **Playback Controls**:
   - 🔊 **Read Response** (Play)
   - ⏸ **Pause**
   - ▶ **Resume**
   - ⏹ **Stop**
3. **Voice & Language Selection**: Dropdown dynamically populated with available system synthesizer voices and language codes.
4. **Text Sanitization**: Strips raw markdown tokens, URLs, citations `[^1]`, and internal chunk IDs before audio rendering.
5. **Unobtrusive Execution**: Visual text answer remains visible at all times; TTS audio is activated explicitly by user action.

---

## 5. Response Transparency Panel (`frontend/src/components/TransparencyPanel.jsx`)

### Responsibilities:
1. **Strict Separation of Concerns**:
   - **Answer**: Grounded text synthesis.
   - **Evidence**: Expandable accordion detailing supporting chunks.
2. **Data Provenance Breakdown**:
   - Source document filename (e.g. `College_Library_Policy.txt`).
   - Chunk ID (e.g. `library_01`).
   - Relevant content block.
   - Normalized cosine similarity score (e.g. `0.910 (91% Match)`).
   - Section and Page number (or *"Metadata not available"* when omitted).
3. **Low-Confidence / Insufficient Information Alert**:
   - Displays *"Evidence: No sufficiently relevant evidence found."* and *"Confidence: Low"* when queries lack grounding data, preventing hallucination.

---

## 6. Updated System Architecture

```
                                    +--------------------+
                                    |     User Query     |
                                    |   (Text or Voice)  |
                                    +---------+----------+
                                              |
                                              v
                             +------------------------------------+
                             |     Conversation Memory Agent      |
                             |   - Coreference resolution         |
                             |   - Context continuation           |
                             |   - Context switching              |
                             |   - Entities & Topic tracking      |
                             +----------------+-------------------+
                                              |
                                              v
                             +------------------------------------+
                             |     Query Understanding Agent      |
                             |   - Factual / Procedural /         |
                             |     Comparative / Ambiguous        |
                             |   - Classification confidence      |
                             +----------------+-------------------+
                                              |
                                              v
                             +------------------------------------+
                             |        Clarification Agent         |
                             |   - Ambiguity & missing info check |
                             |   - Multi-part query decomposition |
                             +----------------+-------------------+
                                              |
                      +-----------------------+-----------------------+
                      |                                               |
          [Ambiguous / Incomplete]                                [Clear]
                      |                                               |
                      v                                               v
   +-------------------------------------+         +------------------------------------+
   |         Clarification State         |         |          Retrieval Agent           |
   |   - awaiting_clarification: true    |         |   - Dense semantic vector search   |
   |   - Ask targeted follow-up question |         |   - Multi-part subquery retrieval  |
   |   - Receive user clarification      |         |   - Relevance threshold filtering  |
   |   - Synthesize refined query        |         +------------------+-----------------+
   +------------------+------------------+                            |
                      |                                               v
                      +----------------------------------->+------------------------------------+
                                                           |     Response Generation Agent      |
                                                           |   - Grounded extractive synthesis  |
                                                           |   - Multi-part answer composition  |
                                                           |   - Zero hallucination guarantee   |
                                                           +------------------+-----------------+
                                                                              |
                                                                              v
                                                           +------------------------------------+
                                                           |    Response Transparency Panel     |
                                                           |   - Answer vs. Retrieved Evidence  |
                                                           |   - Real chunks, scores, metadata  |
                                                           |   - Low-confidence alert handling  |
                                                           +------------------+-----------------+
                                                                              |
                                                                              v
                                                           +------------------------------------+
                                                           |   Text Answer + Text-to-Speech     |
                                                           |   - Play / Pause / Resume / Stop   |
                                                           |   - Voice & Language selection     |
                                                           +------------------------------------+
```

---

## 7. API Schemas & Changes

### `POST /query`

**Request**:
```json
{
  "query": "How long can I keep it?",
  "top_k": 3,
  "conversation_id": "session-uuid-123",
  "user_clarification": "Library book"
}
```

**Response**:
```json
{
  "conversation_id": "session-uuid-123",
  "query": "How long can I keep it?",
  "query_type": "factual",
  "classification_confidence": 0.92,
  "route": "retrieval",
  "clarification_required": false,
  "clarification_question": null,
  "clarification": {
    "clarification_required": false,
    "original_query": "How long can I keep it?",
    "clarification_question": "Are you asking about the borrowing period for library books?",
    "missing_context": "What does 'it' refer to?",
    "awaiting_clarification": false,
    "clarification_response": "Library book",
    "user_clarification": "Library book",
    "refined_query": "How long can a student keep a borrowed library book?"
  },
  "refined_query": "How long can a student keep a borrowed library book?",
  "retrieval": {
    "top_k": 3,
    "results": [...],
    "no_sufficient_information": false
  },
  "retrieved_chunks": [...],
  "response": "Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days.",
  "answer": "Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days.",
  "confidence": "High",
  "sources": [
    {
      "document_name": "College_Library_Policy.txt",
      "chunk_id": "library_01",
      "relevance_score": 0.884,
      "page_number": 1,
      "section": "Book Borrowing"
    }
  ],
  "transparency": {
    "supporting_chunks": [
      {
        "document_name": "College_Library_Policy.txt",
        "chunk_id": "library_01",
        "content": "Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days.",
        "relevance_score": 0.884,
        "section": "Book Borrowing"
      }
    ],
    "has_sufficient_evidence": true,
    "confidence_rationale": "Determined by vector similarity distance of top retrieved evidence chunks."
  },
  "active_topic": "College Library Policy",
  "memory_context": {
    "topic": "College Library Policy",
    "entities": ["Borrowing Policy", "College Library Policy", "Library Books"],
    "referenced_documents": ["College_Library_Policy.txt"],
    "relevant_previous_queries": ["How long can I keep it?"],
    "relevant_previous_answers": ["Each student can borrow up to 4 books at a time. Books are issued for a period of 14 days."],
    "clarification_context": {...}
  }
}
```

### `GET /conversations/{conversation_id}`
Returns session history turns, active topic, referenced documents, and pending clarification.

### `DELETE /conversations/{conversation_id}`
Clears session conversation memory.

---

## 8. Test Scenarios & Results

| Test Scenario | Input Query / Action | Expected Behavior | Outcome |
|---|---|---|---|
| **TEST 1: Ambiguous Query** | *"How long can I keep it?"* | Clarification question asked (*"Are you asking about the borrowing period for library books?"*). No guessing. | ✅ Passed |
| **TEST 2: Clarification** | *"Library book"* | Refined to *"How long can a student keep a borrowed library book?"*. Answer: 14 days. | ✅ Passed |
| **TEST 3: Memory (Coreference)** | *"What is RAG?"* then *"What are its main steps?"* | Resolves *"its"* to *"RAG"*. Answers procedural steps of RAG pipeline. | ✅ Passed |
| **TEST 4: Library Context** | *"How many books can I borrow?"* then *"What about renewal?"* | Resolves renewal to library books. Answers 7-day renewal policy. | ✅ Passed |
| **TEST 5: Context Switch** | *"What is RAG?"* then *"How many books can a student borrow?"* | Switches topic cleanly from RAG to College Library Policy. Answers 4 books. | ✅ Passed |
| **TEST 6: Multi-Part Query** | *"How many books can I borrow and what is the late return fine?"* | Decomposes both sub-intents. Answers 4 books and 2 rupees fine. | ✅ Passed |
| **TEST 7: Voice Input** | Web Speech API speech dictation | Transcribes speech to search input, passes into standard RAG pipeline. | ✅ Passed |
| **TEST 8: Text-to-Speech** | *"What is RAG?"* | Displays normal text, provides Play/Pause/Resume/Stop controls, voice selection. | ✅ Passed |
| **TEST 9: Transparency** | *"How many books can a student borrow?"* | Shows actual source filename, chunk ID, relevance score, section, and confidence. | ✅ Passed |
| **TEST 10: Unavailable Info** | *"What is the hostel fee?"* | Zero hallucination. Returns *"I couldn't find sufficient information"*, Low confidence. | ✅ Passed |
| **TEST 11: Context-Dependent** | *"What about that?"* | Resolves with active context; asks clarification when context is absent. | ✅ Passed |
| **TEST 12: Multi-Turn Clarify** | *"How much can I borrow?"* $\rightarrow$ *"Books."* | Asks clarification $\rightarrow$ user clarifies $\rightarrow$ refines query $\rightarrow$ 4 books. | ✅ Passed |

---

## 9. Known Limitations

1. **Browser Dependency for Speech**: Web Speech API (`SpeechRecognition`) is natively supported in Chromium-based browsers (Chrome, Edge) and Safari; Firefox requires manual flag activation. Fallback text notifications are displayed when unsupported.
2. **Ephemeral Conversation Memory**: Session memory is maintained in-process (or session-scoped database) to guarantee isolation from ChromaDB document storage. Long-term cross-session persistence across server restarts can be backed by SQLite.
3. **Extractive vs. Generative Mode**: When no external LLM API key (`OPENAI_API_KEY`, `GEMINI_API_KEY`) is configured, the system executes deterministic extractive synthesis, guaranteeing 100% adherence to source text with zero hallucination.

---

## 10. Future Improvements

1. **Hybrid Coreference Parsing**: Incorporate small neural anaphora models (e.g. FastCoref) for complex nested pronoun chains.
2. **Audio Streaming**: Implement streaming TTS responses using server-side neural TTS models (e.g. Kokoro / Piper) for sub-50ms audio first-byte latency.
3. **Multi-Document Evidence Highlighting**: Highlight exact matching spans inside PDF / DOCX view panels directly from chunk character offsets.
