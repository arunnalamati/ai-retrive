import re
from typing import Dict, Any
from backend.models.query_models import QueryUnderstandingResponse

class QueryUnderstandingAgent:
    """
    Query Understanding Agent:
    Classifies incoming user queries into one of four distinct intent types:
    - factual: Queries seeking definitions, specific numbers, single facts, or entities.
    - procedural: Queries asking for step-by-step instructions, processes, or how-to workflows.
    - comparative: Queries comparing two or more concepts, agents, or approaches.
    - ambiguous: Queries lacking clear subject context or containing vague pronouns without referents.
    """
    def __init__(self):
        self.agent_name = "Query Understanding Agent"

    def classify(self, query: str) -> Dict[str, Any]:
        cleaned_query = query.strip()
        lower_query = cleaned_query.lower()

        # 1. Ambiguous check:
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
            r"^how so\??$"
        ]
        for pattern in ambiguous_patterns:
            if re.match(pattern, lower_query):
                return {
                    "query": cleaned_query,
                    "query_type": "ambiguous",
                    "classification_confidence": 0.88,
                    "route": "clarification_required",
                    "reasoning": "Query contains vague referents ('it', 'this') without a specific domain noun, requiring clarification."
                }

        # Check if query is <= 4 words and contains vague pronoun without subject noun
        words = re.findall(r'\b\w+\b', lower_query)
        if len(words) <= 4 and any(w in ["it", "this", "that", "these", "those"] for w in words):
            # If no substantive domain nouns exist
            has_domain_noun = any(w in lower_query for w in ["rag", "agent", "leave", "policy", "chroma", "chunk", "document", "upload"])
            if not has_domain_noun and ("how" in words or "what" in words):
                return {
                    "query": cleaned_query,
                    "query_type": "ambiguous",
                    "classification_confidence": 0.82,
                    "route": "clarification_required",
                    "reasoning": "Short query referencing unspecified object or action."
                }

        # 2. Comparative check:
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

        # 3. Procedural check:
        procedural_indicators = [
            "steps in", "steps to", "steps for", "what are the steps",
            "how do i", "how can i", "how to", "procedure for",
            "process of", "pipeline of", "workflow", "lifecycle",
            "instructions for", "how should i", "stages of", "phases of"
        ]
        if any(ind in lower_query for ind in procedural_indicators):
            return {
                "query": cleaned_query,
                "query_type": "procedural",
                "classification_confidence": 0.94,
                "route": "retrieval",
                "reasoning": "Query asks for step-by-step procedures, instructions, or sequential workflow phases."
            }

        # 4. Factual check (default/specific fact lookup):
        # Questions asking what is, who, when, where, how many, policy specifics
        return {
            "query": cleaned_query,
            "query_type": "factual",
            "classification_confidence": 0.92,
            "route": "retrieval",
            "reasoning": "Query asks for specific facts, definitions, quantities, or policy statements."
        }
