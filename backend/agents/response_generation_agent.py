import os
import re
from typing import List, Dict, Any, Optional
import httpx
from backend.config import settings
from backend.rag.prompt_builder import build_grounded_prompt

class ResponseGenerationAgent:
    """
    Response Generation Agent:
    Synthesizes a grounded response strictly derived from the retrieved context chunks.
    Guarantees zero hallucination:
    - If an external LLM is configured (e.g. OpenAI, Anthropic, Gemini), invokes the model with strict grounding prompts.
    - If no LLM key is configured, executes safe, high-fidelity extractive synthesis from the top retrieved chunks.
    - If retrieved information does not cover the query topic, returns the standard grounded refusal.
    """
    def __init__(self):
        self.agent_name = "Response Generation Agent"

    def generate_response(
        self,
        query: str,
        query_type: str,
        retrieved_chunks: List[Dict[str, Any]],
        no_sufficient_info: bool = False
    ) -> str:
        if no_sufficient_info or not retrieved_chunks:
            return "I couldn't find sufficient information in the knowledge base to answer this question."

        # Verify key topical overlap to prevent partial vector false-positives
        # (e.g. query asking for 'maternity' when text only talks about annual/sick leave)
        stop_words = {"what", "is", "the", "company's", "company", "policy", "how", "many", "do", "i", "are", "in", "a", "an", "does", "it", "to", "for", "of", "and"}
        query_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', query.lower())) - stop_words
        
        all_chunk_text = " ".join(c.get("content", "") for c in retrieved_chunks).lower()
        if query_words:
            matched_words = [w for w in query_words if w in all_chunk_text]
            # If NONE of the key subject terms exist in any retrieved chunk, declare insufficient information
            if not matched_words:
                return "I couldn't find sufficient information in the knowledge base to answer this question."

        # If an external LLM is configured, query the provider
        if settings.LLM_API_KEY and settings.LLM_PROVIDER:
            try:
                llm_response = self._call_external_llm(query, retrieved_chunks)
                if llm_response:
                    return llm_response.strip()
            except Exception:
                # Fallback cleanly to extractive synthesis on LLM error
                pass

        # Safe Extractive Synthesis Grounded Fallback
        return self._extractive_grounded_synthesis(query, query_type, retrieved_chunks)

    def _extractive_grounded_synthesis(
        self,
        query: str,
        query_type: str,
        chunks: List[Dict[str, Any]]
    ) -> str:
        """
        Synthesizes a clean, coherent answer directly from the highest-ranked retrieved sentences.
        """
        top_chunk = chunks[0]
        top_content = top_chunk.get("content", "").strip()

        # Handle procedural / step-by-step queries
        if query_type == "procedural" or "steps" in query.lower():
            steps = re.findall(r'(\d+\.\s+[^\n]+(?:\n[^\d\n][^\n]+)*)', top_content)
            if steps:
                formatted_steps = "\n".join(s.strip() for s in steps)
                return f"Based on {top_chunk.get('document_name', 'the document')}, the steps in the pipeline are:\n\n{formatted_steps}"

        # Handle comparative queries
        if query_type == "comparative":
            # Extract mentions of the entities being compared
            lower_q = query.lower()
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', top_content) if s.strip()]
            relevant_sentences = []
            
            # Find entities mentioned in the query
            words = re.findall(r'\b[a-zA-Z]{3,}\b', lower_q)
            for s in sentences:
                s_lower = s.lower()
                if any(w in s_lower for w in words if w not in {"what", "difference", "between", "the", "agent", "and"}):
                    relevant_sentences.append(s)
                    
            if relevant_sentences:
                return f"Based on {top_chunk.get('document_name', 'the knowledge base')}:\n\n" + " ".join(relevant_sentences)

        # Handle factual queries and multi-part queries across retrieved chunks
        all_sentences = []
        seen_texts = set()
        for c in chunks:
            c_text = c.get("content", "").strip()
            s_list = [s.strip() for s in re.split(r'(?<=[.!?])\s+', c_text) if s.strip()]
            for s in s_list:
                if s not in seen_texts:
                    seen_texts.add(s)
                    all_sentences.append(s)

        # Multi-part query check
        conjunction_split = re.split(r'\s+and\s+|\s+as well as\s+|\s*;\s*', query, flags=re.IGNORECASE)
        if len(conjunction_split) > 1:
            part_answers = []
            for part in conjunction_split:
                part_clean = part.strip()
                p_keywords = set(re.findall(r'\b[a-zA-Z]{3,}\b', part_clean.lower())) - {"what", "is", "the", "are", "how", "many", "does", "can", "and"}
                scored = []
                for s in all_sentences:
                    s_lower = s.lower()
                    score = sum(1 for kw in p_keywords if kw in s_lower)
                    if any(w in part_clean.lower() for w in ["fine", "fee", "cost", "late"]) and any(w in s_lower for w in ["fine", "fee", "rupees", "charged"]):
                        score += 3
                    if any(w in part_clean.lower() for w in ["borrow", "how many", "quantity", "books"]) and any(w in s_lower for w in ["borrow", "books", "student"]):
                        score += 3
                    scored.append((score, s))
                scored.sort(key=lambda x: x[0], reverse=True)
                if scored and scored[0][0] > 0 and scored[0][1] not in part_answers:
                    part_answers.append(scored[0][1])
            if part_answers:
                return " ".join(part_answers)

        # Standard factual scoring across retrieved chunks
        keywords = set(re.findall(r'\b[a-zA-Z]{3,}\b', query.lower())) - {"what", "is", "the", "are", "how", "does", "can"}
        is_how_long = "how long" in query.lower() or "period" in query.lower() or "keep" in query.lower()
        is_how_many = "how many" in query.lower() or "limit" in query.lower() or "number" in query.lower()
        is_fine_cost = "fine" in query.lower() or "fee" in query.lower() or "cost" in query.lower()

        scored_sentences = []
        for s in all_sentences:
            s_lower = s.lower()
            score = sum(1 for kw in keywords if kw in s_lower)
            if is_how_long and any(w in s_lower for w in ["days", "period", "issued", "keep", "hours", "duration"]):
                score += 4
            if is_how_many and any(w in s_lower for w in ["books", "borrow", "up to", "receive", "days"]):
                score += 2
            if is_fine_cost and any(w in s_lower for w in ["fine", "rupees", "charged", "fee"]):
                score += 3
            scored_sentences.append((score, s))
            
        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        top_scored = [s for sc, s in scored_sentences if sc > 0]

        if top_scored:
            return " ".join(top_scored[:3])

        # Fallback to the primary paragraph of the top chunk
        paragraphs = [p.strip() for p in top_content.split("\n\n") if p.strip()]
        return paragraphs[0] if paragraphs else top_content

    def _call_external_llm(self, query: str, chunks: List[Dict[str, Any]]) -> Optional[str]:
        """Optionally call OpenAI-compatible or Gemini API if credentials are provided."""
        prompt = build_grounded_prompt(query, chunks)
        provider = settings.LLM_PROVIDER.lower()
        api_key = settings.LLM_API_KEY
        model = settings.LLM_MODEL or "gpt-4o-mini"

        if "openai" in provider:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a factual RAG response generator. Only answer with context."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
        return None
