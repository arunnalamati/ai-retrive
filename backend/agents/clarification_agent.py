import re
from typing import Dict, Any, List, Optional, Tuple
from backend.models.query_models import ClarificationState

class ClarificationAgent:
    """
    Clarification Agent (Milestone 3.1):
    Responsible for:
    1. Detecting ambiguous, incomplete, context-dependent, or multi-interpretation queries.
    2. Generating concise, targeted follow-up questions for missing parameters without asking unnecessary questions.
    3. Decomposing and evaluating multi-part queries.
    4. Maintaining original query, clarification question, user clarification, and synthesized refined query.
    """
    def __init__(self):
        self.agent_name = "Clarification Agent"

        # Explicit known targeted clarification templates for high precision on common ambiguous patterns
        self._targeted_templates = [
            {
                "patterns": [
                    r"^how long can i keep it\??$",
                    r"^how long can we keep it\??$",
                    r"^how long to keep it\??$",
                    r"^can i keep it\??$"
                ],
                "question": "Are you asking about the borrowing period for library books?",
                "missing_context": "What does 'it' refer to?",
                "default_topic": "library books",
                "refine_format": "How long can a student keep a borrowed library book?"
            },
            {
                "patterns": [
                    r"^how much can (?:i|we) borrow\??$",
                    r"^how many can (?:i|we) borrow\??$",
                    r"^can (?:i|we) borrow\??$",
                    r"^how much to borrow\??$",
                    r"^how many to borrow\??$"
                ],
                "question": "What would you like to borrow — library books or something else?",
                "missing_context": "What item or resource are you asking to borrow?",
                "default_topic": "library books",
                "refine_format": "How many books can a student borrow?"
            },
            {
                "patterns": [
                    r"^what is the fee\??$",
                    r"^what is the cost\??$",
                    r"^how much is the fee\??$",
                    r"^what fee\??$"
                ],
                "question": "Are you asking about the late return fine for library books?",
                "missing_context": "Which fee or fine are you asking about?",
                "default_topic": "library books late fee",
                "refine_format": "What is the late return fine for library books?"
            },
            {
                "patterns": [
                    r"^how does it work\??$",
                    r"^how does this work\??$",
                    r"^what does it do\??$",
                    r"^how do they work\??$"
                ],
                "question": "Could you please provide clarification on which system component or workflow you would like explained (for example, the RAG retrieval pipeline)?",
                "missing_context": "Which system component or workflow do you mean?",
                "default_topic": "RAG pipeline",
                "refine_format": "How does the RAG retrieval pipeline work?"
            },
            {
                "patterns": [
                    r"^what are its advantages\??$",
                    r"^what are its benefits\??$",
                    r"^what are the advantages\??$",
                    r"^what are its steps\??$"
                ],
                "question": "Could you specify which technology or architecture you are inquiring about (for example, RAG architecture)?",
                "missing_context": "What does 'its' refer to?",
                "default_topic": "RAG architecture",
                "refine_format": "What are the advantages of RAG architecture?"
            },
            {
                "patterns": [
                    r"^what about that document\??$",
                    r"^tell me about that document\??$",
                    r"^what does that document say\??$"
                ],
                "question": "Could you specify which document or policy you are referring to (for example, College Library Policy or AI RAG Guide)?",
                "missing_context": "Which document is being referred to?",
                "default_topic": "College Library Policy",
                "refine_format": "What information is provided in that document?"
            }
        ]

    def evaluate_ambiguity(
        self,
        query: str,
        conversation_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Determines whether the query requires clarification.
        Takes active conversation context into account:
        If active context already resolves the referent, NO clarification is needed.
        """
        cleaned_query = query.strip()
        lower_query = cleaned_query.lower()

        # 1. If conversation memory already resolved the referents, check if confident
        if conversation_context and conversation_context.get("active_topic"):
            # Context is active, let retrieval handle with resolved context
            has_explicit_context = bool(conversation_context.get("last_query") or conversation_context.get("active_topic"))
            # If the user query is a natural follow up with active context, do NOT trigger clarification
            if has_explicit_context and any(w in lower_query for w in ["its", "it", "renewal", "steps", "policy", "fine", "period", "more"]):
                return {
                    "clarification_required": False,
                    "original_query": cleaned_query,
                    "clarification_question": None,
                    "missing_context": None,
                    "refined_query": None
                }

        # 2. Check targeted known ambiguous templates
        for tmpl in self._targeted_templates:
            for pat in tmpl["patterns"]:
                if re.match(pat, lower_query):
                    return {
                        "clarification_required": True,
                        "original_query": cleaned_query,
                        "clarification_question": tmpl["question"],
                        "missing_context": tmpl["missing_context"],
                        "refined_query": None
                    }

        # 3. Check for multi-part queries
        multipart_parts = self.decompose_multipart(cleaned_query)
        if multipart_parts and len(multipart_parts) > 1:
            # Check if any individual part is ambiguous
            for part in multipart_parts:
                part_eval = self._evaluate_single_intent(part)
                if part_eval["is_ambiguous"]:
                    return {
                        "clarification_required": True,
                        "original_query": cleaned_query,
                        "clarification_question": f"For the part '{part}', could you clarify: {part_eval['question']}",
                        "missing_context": part_eval["missing_context"],
                        "refined_query": None
                    }
            # All parts are clear
            return {
                "clarification_required": False,
                "original_query": cleaned_query,
                "clarification_question": None,
                "missing_context": None,
                "refined_query": None,
                "multipart_subqueries": multipart_parts
            }

        # 4. Check general ambiguity heuristics (short queries, isolated pronouns without referents)
        single_eval = self._evaluate_single_intent(cleaned_query)
        if single_eval["is_ambiguous"]:
            return {
                "clarification_required": True,
                "original_query": cleaned_query,
                "clarification_question": single_eval["question"],
                "missing_context": single_eval["missing_context"],
                "refined_query": None
            }

        return {
            "clarification_required": False,
            "original_query": cleaned_query,
            "clarification_question": None,
            "missing_context": None,
            "refined_query": None
        }

    def _evaluate_single_intent(self, text: str) -> Dict[str, Any]:
        """Evaluates whether a single sentence/clause has missing referents or parameters."""
        lower = text.lower().strip()
        words = re.findall(r'\b\w+\b', lower)
        
        # Check isolated pronouns without nouns
        pronouns = ["it", "this", "that", "them", "these", "those", "its"]
        has_pronoun = any(p in words for p in pronouns)
        
        known_domain_nouns = {
            "book", "books", "library", "fine", "borrow", "rag", "retrieval", 
            "generation", "chunk", "embedding", "vector", "database", "chroma", 
            "leave", "employee", "vacation", "student", "college", "policy", "days"
        }
        has_domain_noun = any(w in words for w in known_domain_nouns)

        if has_pronoun and not has_domain_noun:
            if "keep" in words:
                return {
                    "is_ambiguous": True,
                    "question": "Are you asking about the borrowing period for library books?",
                    "missing_context": "What does 'it' refer to?"
                }
            if "fee" in words or "cost" in words:
                return {
                    "is_ambiguous": True,
                    "question": "Are you asking about the late return fine for library books?",
                    "missing_context": "Which fee or fine is being requested?"
                }
            if "work" in words or "works" in words or "steps" in words:
                return {
                    "is_ambiguous": True,
                    "question": "Could you specify which system component or workflow you would like explained?",
                    "missing_context": "Which system component or workflow do you mean?"
                }
            if "advantages" in words or "benefit" in words or "benefits" in words:
                return {
                    "is_ambiguous": True,
                    "question": "Could you specify which technology or architecture you are inquiring about?",
                    "missing_context": "What does 'its' refer to?"
                }
            if "document" in words or "file" in words:
                return {
                    "is_ambiguous": True,
                    "question": "Could you specify which document or policy you are referring to?",
                    "missing_context": "Which document is being referenced?"
                }
            # Short generic pronoun question
            if len(words) <= 5:
                return {
                    "is_ambiguous": True,
                    "question": f"Could you provide more context on what you mean by '{text}'?",
                    "missing_context": "Unspecified referent"
                }

        # Standalone vague phrases
        if lower in ["how does it work?", "how does it work", "what is it?", "what is it", "tell me more"]:
            return {
                "is_ambiguous": True,
                "question": "Could you specify which topic or system component you would like explained?",
                "missing_context": "Target topic is unspecified"
            }

        return {"is_ambiguous": False, "question": None, "missing_context": None}

    def decompose_multipart(self, query: str) -> Optional[List[str]]:
        """
        Detects multi-part queries joined by conjunctions (and, as well as, also, etc.)
        Example: 'How many books can I borrow and what is the late return fine?'
        -> ['How many books can I borrow', 'what is the late return fine']
        """
        # Split on coordinating conjunctions with question indicators
        patterns = [
            r'\s+and\s+(?:what|how|why|when|where|who|is|are|can)\b',
            r'\s+as well as\s+(?:what|how|why|when|where|who|is|are|can)\b',
            r'\s*;\s*',
            r'\s+also\s+(?:what|how|why|when|where|who|is|are|can)\b'
        ]
        
        for pat in patterns:
            splits = re.split(pat, query, flags=re.IGNORECASE)
            if len(splits) > 1 and all(len(s.strip()) > 3 for s in splits):
                # Reconstruct natural sub-queries
                subqueries = []
                subqueries.append(splits[0].strip().rstrip('?'))
                # Re-add question word if omitted by split
                match = re.search(pat, query, flags=re.IGNORECASE)
                if match:
                    matched_text = match.group(0).strip()
                    # extract the question word
                    q_words = re.findall(r'\b(what|how|why|when|where|who|is|are|can)\b', matched_text, re.IGNORECASE)
                    prefix = q_words[0] + " " if q_words else ""
                    subqueries.append(prefix + splits[1].strip().rstrip('?'))
                else:
                    subqueries.append(splits[1].strip().rstrip('?'))
                return subqueries

        return None

    def refine_query(
        self,
        original_query: str,
        user_clarification: str,
        clarification_question: Optional[str] = None
    ) -> str:
        """
        Synthesizes a clean, refined search query by combining original query and user's clarification.
        Example:
        Original: "How long can I keep it?"
        Clarification: "library books" or "Yes, library books."
        Refined: "How long can a student keep a borrowed library book?"
        """
        orig_clean = original_query.strip().rstrip('?')
        orig_lower = orig_clean.lower()
        user_clean = user_clarification.strip().rstrip('.')
        user_lower = user_clean.lower()

        # Check matched templates for tailored clean phrasing
        if "borrow" in orig_lower:
            if any(k in user_lower for k in ["book", "books", "library", "yes"]):
                return "How many books can a student borrow?"
            return f"How many {user_clean} can a student borrow?"

        if "keep it" in orig_lower:
            if any(k in user_lower for k in ["library", "book", "books", "yes"]):
                return "How long can a student keep a borrowed library book?"
            return f"{orig_clean} for {user_clean}?"

        if "fee" in orig_lower or "cost" in orig_lower:
            if any(k in user_lower for k in ["library", "book", "books", "late", "return", "yes"]):
                return "What is the late return fine for library books?"
            return f"What is the fee for {user_clean}?"

        if "how does it work" in orig_lower or "how does this work" in orig_lower:
            clean_term = re.sub(r'^(the\s+|a\s+|an\s+|yes,?\s*)', '', user_clean, flags=re.IGNORECASE)
            return f"How does {clean_term} work?"

        if "its advantages" in orig_lower or "its benefits" in orig_lower:
            clean_term = re.sub(r'^(the\s+|a\s+|an\s+|yes,?\s*)', '', user_clean, flags=re.IGNORECASE)
            return f"What are the advantages of {clean_term}?"

        if "that document" in orig_lower:
            clean_term = re.sub(r'^(the\s+|a\s+|an\s+|yes,?\s*)', '', user_clean, flags=re.IGNORECASE)
            return f"What information is in {clean_term}?"

        # General referent substitution
        pronouns_to_replace = [r'\bit\b', r'\bthis\b', r'\bthat\b', r'\bits\b', r'\bthem\b']
        cleaned_clarification = re.sub(r'^(yes,?\s*|sure,?\s*)', '', user_clean, flags=re.IGNORECASE).strip()
        
        refined = orig_clean
        for p in pronouns_to_replace:
            if re.search(p, refined, flags=re.IGNORECASE):
                refined = re.sub(p, cleaned_clarification, refined, count=1, flags=re.IGNORECASE)
                return refined + "?"

        # Fallback combination
        return f"{orig_clean} regarding {cleaned_clarification}?"

    def formulate_clarification(self, query: str, reasoning: str = None) -> str:
        """
        Backward-compatible helper method for M2 callers.
        """
        eval_result = self.evaluate_ambiguity(query)
        if eval_result.get("clarification_question"):
            return eval_result["clarification_question"]
        return (
            "Your query appears ambiguous or incomplete. Could you please specify which topic, "
            "system component, or policy document you would like information about?\n\n"
            "For example:\n"
            "• 'What is RAG?'\n"
            "• 'How long can a student keep a borrowed library book?'\n"
            "• 'How many books can a student borrow?'"
        )
