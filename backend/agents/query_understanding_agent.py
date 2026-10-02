import re
from typing import Dict, Any
from backend.models.query_models import QueryUnderstandingResponse

class QueryUnderstandingAgent:
    """
    Query Understanding Agent (Milestone 4.3):
    Classifies incoming user queries into specialized intent types:
    - factual: Queries seeking definitions, specific numbers, single facts, or entities.
    - procedural: Queries asking for step-by-step instructions, processes, or how-to workflows.
    - comparative: Queries comparing two or more concepts, options, or policies.
    - ambiguous: Queries lacking clear subject context or containing vague pronouns without referents.
    - multi_part: Compound queries containing two or more distinct questions joined by conjunctions.
    - follow_up: Queries relying on conversational context or follow-up continuation.
    """
    def __init__(self):
        self.agent_name = "Query Understanding Agent"

    def classify(self, query: str) -> Dict[str, Any]:
        cleaned_query = (query or "").strip() if isinstance(query, str) else ""
        if not cleaned_query:
            return {
                "query": "",
                "query_type": "ambiguous",
                "classification_confidence": 0.50,
                "route": "clarification_required",
                "reasoning": "Query is empty or invalid."
            }
        lower_query = cleaned_query.lower()

        # 1. Multi-part check:
        # Detect compound queries joined by conjunctions
        multipart_patterns = [
            r"\band\s+(?:what|how|why|when|where|who|is|are|can|does)\b",
            r"\bas well as\s+(?:what|how|why|when|where|who|is|are|can|does)\b",
            r";\s*(?:what|how|why|when|where|who|is|are|can|does)\b",
            r"\balso\s+(?:what|how|why|when|where|who|is|are|can|does)\b"
        ]
        if any(re.search(pat, lower_query) for pat in multipart_patterns):
            return {
                "query": cleaned_query,
                "query_type": "multi_part",
                "classification_confidence": 0.95,
                "route": "retrieval",
                "reasoning": "Query contains multiple distinct sub-questions joined by coordinating conjunctions."
            }

        # 2. Ambiguous check:
        # Very short queries with indefinite pronouns or questions without specific context
        ambiguous_patterns = [
            r"^how does it work\??$",
            r"^how does this work\??$",
            r"^what is it\??$",
            r"^what does it do\??$",
            r"^tell me more\??$",
            r"^explain this\??$",
            r"^explain it\??$",
            r"^why\??$",
            r"^how\??$",
            r"^what about that\??$",
            r"^how so\??$",
            r"^how long can (?:i|we) keep it\??$",
            r"^how much can (?:i|we) borrow\??$",
            r"^how many can (?:i|we) borrow\??$",
            r"^can (?:i|we) borrow\??$",
            r"^how much to borrow\??$",
            r"^how many to borrow\??$",
            r"^what is the fee\??$",
            r"^what is the cost\??$",
            r"^what are its (?:advantages|benefits|steps)\??$",
            r"^what about that document\??$",
            r"^(?:rules|policy|regulations|fees|guidelines|procedure)\??$"
        ]
        for pattern in ambiguous_patterns:
            if re.match(pattern, lower_query):
                return {
                    "query": cleaned_query,
                    "query_type": "ambiguous",
                    "classification_confidence": 0.90,
                    "route": "clarification_required",
                    "reasoning": "Query contains vague referents or missing context without a specific domain noun, requiring clarification."
                }

        # Check if query is <= 4 words and contains vague pronoun without domain noun
        words = re.findall(r'\b\w+\b', lower_query)
        if len(words) <= 4 and any(w in ["it", "this", "that", "these", "those"] for w in words):
            # If no substantive domain nouns exist
            has_domain_noun = any(w in lower_query for w in [
                "rag", "agent", "leave", "policy", "chroma", "chunk", "document", "upload",
                "book", "library", "hostel", "room", "mess", "exam", "attendance", "grade", "fee"
            ])
            if not has_domain_noun and ("how" in words or "what" in words):
                return {
                    "query": cleaned_query,
                    "query_type": "ambiguous",
                    "classification_confidence": 0.82,
                    "route": "clarification_required",
                    "reasoning": "Short query referencing unspecified object or action."
                }

        # 3. Follow-up check:
        # Detect natural follow-up queries that depend on active conversation context
        follow_up_patterns = [
            r"^what about\b",
            r"^how about\b",
            r"^and what about\b",
            r"^and for\b",
            r"^can (?:i|we) renew\b",
            r"^what about its\b",
            r"^tell me its\b"
        ]
        if any(re.search(pat, lower_query) for pat in follow_up_patterns):
            return {
                "query": cleaned_query,
                "query_type": "follow_up",
                "classification_confidence": 0.93,
                "route": "retrieval",
                "reasoning": "Query is a conversational follow-up continuation building on active session context."
            }

        # 4. Comparative check:
        comparative_indicators = [
            "difference between", "differ from", "differences between",
            "compare", "comparison", "versus", " vs ", " vs. ",
            "better than", "contrast", "distinguish between",
            "how do they differ", "pros and cons", "advantages and disadvantages"
        ]
        if any(ind in lower_query for ind in comparative_indicators):
            return {
                "query": cleaned_query,
                "query_type": "comparative",
                "classification_confidence": 0.96,
                "route": "retrieval",
                "reasoning": "Query asks for comparison or distinction between multiple concepts or components."
            }

        # 5. Procedural check:
        procedural_indicators = [
            "steps in", "steps to", "steps for", "what are the steps",
            "how do i", "how can i", "how to", "procedure for",
            "process of", "pipeline of", "workflow", "lifecycle",
            "instructions for", "how should i", "stages of", "phases of",
            "how is it evaluated", "how are marks calculated", "how can a student apply"
        ]
        if any(ind in lower_query for ind in procedural_indicators):
            return {
                "query": cleaned_query,
                "query_type": "procedural",
                "classification_confidence": 0.94,
                "route": "retrieval",
                "reasoning": "Query asks for step-by-step procedures, instructions, or sequential workflow phases."
            }

        # 6. Factual check (default/specific fact lookup):
        # Questions asking what is, who, when, where, how many, policy specifics
        return {
            "query": cleaned_query,
            "query_type": "factual",
            "classification_confidence": 0.92,
            "route": "retrieval",
            "reasoning": "Query asks for specific facts, definitions, quantities, or policy statements."
        }
