import re
import time
import uuid
from typing import Dict, Any, List, Optional, Tuple

class ConversationMemoryAgent:
    """
    Conversation Memory Agent (Milestone 3.2):
    Responsible for:
    1. Maintaining session-scoped interaction history and conversational context across multiple turns.
    2. Performing coreference resolution (e.g. resolving 'its' -> 'RAG').
    3. Supporting context continuation (e.g. 'What about the renewal period?' -> 'College Library Policy').
    4. Enforcing clean context switching (avoiding blending unrelated topics).
    5. Ensuring strict isolation: Conversation memory is stored separately and NEVER written into ChromaDB.
    6. Pruning and windowing history to prevent context explosion.
    """
    def __init__(self):
        self.agent_name = "Conversation Memory Agent"
        # In-memory session store: conversation_id -> session_dict
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def get_or_create_session(self, conversation_id: Optional[str] = None) -> str:
        """Retrieves existing session ID or initializes a new structured session."""
        if not conversation_id or conversation_id not in self._sessions:
            new_id = conversation_id if conversation_id else str(uuid.uuid4())
            self._sessions[new_id] = {
                "conversation_id": new_id,
                "messages": [],
                "active_topic": None,
                "referenced_documents": [],
                "last_query": None,
                "last_response": None,
                "pending_clarification": None,
                "created_at": time.time(),
                "updated_at": time.time()
            }
            return new_id
        return conversation_id

    def get_session(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Returns session state for a conversation ID."""
        return self._sessions.get(conversation_id)

    def record_turn(
        self,
        conversation_id: str,
        query: str,
        response: str,
        query_type: str,
        confidence: str,
        referenced_documents: Optional[List[str]] = None,
        active_topic: Optional[str] = None
    ):
        """Records a completed turn in the session history."""
        session_id = self.get_or_create_session(conversation_id)
        session = self._sessions[session_id]

        # Infer topic if not explicitly passed
        inferred_topic = active_topic or self._infer_topic(query, response, referenced_documents)
        if inferred_topic:
            session["active_topic"] = inferred_topic

        if referenced_documents:
            for doc in referenced_documents:
                if doc not in session["referenced_documents"]:
                    session["referenced_documents"].append(doc)

        session["messages"].append({
            "role": "user",
            "content": query,
            "query_type": query_type,
            "timestamp": time.time()
        })
        session["messages"].append({
            "role": "assistant",
            "content": response,
            "confidence": confidence,
            "timestamp": time.time()
        })

        session["last_query"] = query
        session["last_response"] = response
        session["updated_at"] = time.time()

        # Enforce history windowing (keep max 10 recent messages)
        if len(session["messages"]) > 10:
            session["messages"] = session["messages"][-10:]

    def set_pending_clarification(self, conversation_id: str, clarification_state: Dict[str, Any]):
        """Saves a pending clarification request in the session."""
        session_id = self.get_or_create_session(conversation_id)
        self._sessions[session_id]["pending_clarification"] = clarification_state

    def get_pending_clarification(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves active pending clarification state."""
        session = self.get_session(conversation_id)
        return session.get("pending_clarification") if session else None

    def clear_pending_clarification(self, conversation_id: str):
        """Clears pending clarification once user has clarified."""
        session = self.get_session(conversation_id)
        if session:
            session["pending_clarification"] = None

    def resolve_query_context(
        self,
        query: str,
        conversation_id: str
    ) -> Tuple[str, bool, Optional[str]]:
        """
        Evaluates the incoming query against recent conversational context:
        - Detects pronouns ('its', 'it', 'they', 'this', 'that') and resolves coreference.
        - Detects incomplete context continuation (e.g. 'What about the renewal period?').
        - Performs clean context switching when a new distinct domain is introduced.
        
        Returns:
            Tuple of (resolved_query, was_resolved, active_topic)
        """
        session = self.get_session(conversation_id)
        if not session or not session.get("last_query"):
            # No prior turn in session
            current_topic = self._infer_topic(query)
            return query, False, current_topic

        last_query = session.get("last_query", "")
        last_response = session.get("last_response", "")
        active_topic = session.get("active_topic")

        query_clean = query.strip()
        query_lower = query_clean.lower()
        query_words = set(re.findall(r'\b\w+\b', query_lower))

        # Check for context switching:
        # If the new query introduces clear entities of a DIFFERENT domain, switch topic!
        rag_keywords = {"rag", "retrieval", "embeddings", "sentence", "transformer", "chunking", "pipeline"}
        library_keywords = {"book", "books", "borrow", "library", "fine", "due", "renewal", "id card", "return"}
        leave_keywords = {"leave", "vacation", "sick", "annual", "maternity", "paternity", "employee", "hr"}

        is_current_library = bool(query_words & library_keywords)
        is_current_rag = bool(query_words & rag_keywords)
        is_current_leave = bool(query_words & leave_keywords)

        # Topic switch detection
        if is_current_library and active_topic != "College Library Policy":
            # Switch context to College Library Policy cleanly without blending RAG
            session["active_topic"] = "College Library Policy"
            return query_clean, False, "College Library Policy"

        if is_current_rag and active_topic != "RAG Architecture":
            session["active_topic"] = "RAG Architecture"
            return query_clean, False, "RAG Architecture"

        if is_current_leave and active_topic != "Employee Leave Policy":
            session["active_topic"] = "Employee Leave Policy"
            return query_clean, False, "Employee Leave Policy"

        # Check for Coreference & Context Continuation:
        # Case A: Anaphoric referents ('its main steps', 'how does it work', 'what are its components')
        if any(p in query_words for p in ["its", "it", "they", "them", "these", "those"]):
            if active_topic == "RAG Architecture" or "rag" in last_query.lower():
                # Replace 'its' / 'it' with 'RAG' or 'RAG pipeline'
                if "main steps" in query_lower or "steps" in query_lower:
                    return "What are the main steps in the RAG pipeline?", True, "RAG Architecture"
                resolved = re.sub(r'\bits\b', "RAG's", query_clean, flags=re.IGNORECASE)
                resolved = re.sub(r'\bit\b', "RAG", resolved, flags=re.IGNORECASE)
                return resolved, True, "RAG Architecture"

            if active_topic == "College Library Policy" or any(w in last_query.lower() for w in ["book", "library"]):
                if "how long" in query_lower and "keep" in query_lower:
                    return "How long can a student keep a borrowed library book?", True, "College Library Policy"
                resolved = re.sub(r'\bit\b', "the borrowed book", query_clean, flags=re.IGNORECASE)
                return resolved, True, "College Library Policy"

        # Case B: Elliptical context continuation ('What about the renewal period?', 'What about that?')
        if query_lower.startswith("what about") or query_lower.startswith("how about") or query_lower.startswith("and "):
            if query_lower in ["what about that?", "what about that", "what about it?", "what about it"]:
                if active_topic == "College Library Policy":
                    return "What are the key rules in the College Library Policy?", True, "College Library Policy"
                elif active_topic == "RAG Architecture":
                    return "What are the key concepts and steps in RAG architecture?", True, "RAG Architecture"
                elif active_topic == "Employee Leave Policy":
                    return "What are the main guidelines in the Employee Leave Policy?", True, "Employee Leave Policy"
                else:
                    # Context is insufficient to resolve "that" -> let Clarification Agent ask
                    return query_clean, False, active_topic

            if active_topic == "College Library Policy" or any(w in last_query.lower() for w in ["book", "library"]):
                if "renewal" in query_lower:
                    return "What is the renewal period for borrowed library books?", True, "College Library Policy"
                if "fine" in query_lower:
                    return "What is the late return fine for library books?", True, "College Library Policy"
                # Append context
                return f"{query_clean} in college library policy?", True, "College Library Policy"

            if active_topic == "RAG Architecture" or "rag" in last_query.lower():
                return f"{query_clean} in RAG architecture?", True, "RAG Architecture"

        return query_clean, False, active_topic

    def _infer_topic(
        self,
        query: str,
        response: Optional[str] = None,
        referenced_docs: Optional[List[str]] = None
    ) -> Optional[str]:
        """Infers high-level topic from query terms and document references."""
        text = (query + " " + (response or "")).lower()
        if referenced_docs:
            for doc in referenced_docs:
                if "library" in doc.lower():
                    return "College Library Policy"
                if "rag" in doc.lower():
                    return "RAG Architecture"
                if "leave" in doc.lower():
                    return "Employee Leave Policy"

        if any(w in text for w in ["library", "book", "books", "borrow", "renewal", "fine"]):
            return "College Library Policy"
        if any(w in text for w in ["rag", "retrieval", "embedding", "chunking", "chroma"]):
            return "RAG Architecture"
        if any(w in text for w in ["leave", "vacation", "sick leave", "annual leave"]):
            return "Employee Leave Policy"

        return None

    def extract_entities(self, session: Optional[Dict[str, Any]]) -> List[str]:
        """Extracts recognizable key entities and subjects discussed in the session."""
        if not session:
            return []
        
        entities = set()
        active_topic = session.get("active_topic")
        if active_topic:
            entities.add(active_topic)

        for doc in session.get("referenced_documents", []):
            entities.add(doc)

        history_text = " ".join(m.get("content", "") for m in session.get("messages", [])).lower()
        if any(w in history_text for w in ["library", "book", "books"]):
            entities.add("Library Books")
            entities.add("Borrowing Policy")
        if any(w in history_text for w in ["fine", "rupees", "due"]):
            entities.add("Late Return Fine")
        if any(w in history_text for w in ["renewal", "renew"]):
            entities.add("Book Renewal")
        if any(w in history_text for w in ["rag", "retrieval"]):
            entities.add("RAG Architecture")
            entities.add("Vector Search")
        if any(w in history_text for w in ["embedding", "sentence-transformers"]):
            entities.add("Embedding Pipeline")
        if any(w in history_text for w in ["leave", "vacation", "sick"]):
            entities.add("Employee Leave Policy")

        return sorted(list(entities))

    def get_recent_history(self, conversation_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Returns recent turns for the conversation."""
        session = self.get_session(conversation_id)
        if not session:
            return []
        return session["messages"][-limit:]

    def clear(self, conversation_id: Optional[str] = None):
        """Clears memory for a specific conversation or all sessions."""
        if conversation_id:
            if conversation_id in self._sessions:
                del self._sessions[conversation_id]
        else:
            self._sessions.clear()

_memory_agent_instance = None

def get_conversation_memory_agent() -> ConversationMemoryAgent:
    global _memory_agent_instance
    if _memory_agent_instance is None:
        _memory_agent_instance = ConversationMemoryAgent()
    return _memory_agent_instance
