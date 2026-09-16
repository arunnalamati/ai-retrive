from typing import List, Dict, Any

def build_grounded_prompt(query: str, chunks: List[Dict[str, Any]]) -> str:
    """
    Construct a grounded prompt instructing an LLM to answer solely using the provided context chunks.
    Explicitly instructs the model not to hallucinate or use external assumptions.
    """
    context_blocks = []
    for idx, c in enumerate(chunks):
        doc_name = c.get("document_name", "Unknown Document")
        chunk_id = c.get("chunk_id", f"chunk_{idx+1}")
        content = c.get("content", "").strip()
        context_blocks.append(f"--- [Source: {doc_name} | Chunk: {chunk_id}] ---\n{content}")

    context_str = "\n\n".join(context_blocks)

    prompt = f"""You are a precise, grounded AI assistant in a Multi-Agent RAG system.
Answer the user's question using ONLY the retrieved context chunks below.
Do NOT invent facts, extrapolate, or use outside knowledge.
If the retrieved context does not contain sufficient facts to answer the question, clearly respond:
"I couldn't find sufficient information in the knowledge base to answer this question."

=== RETRIEVED CONTEXT ===
{context_str}
=========================

USER QUESTION:
{query}

GROUNDED ANSWER:"""
    return prompt
