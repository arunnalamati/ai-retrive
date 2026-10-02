import time
import logging
from typing import Dict, Any, List, Optional
from backend.agents.query_understanding_agent import QueryUnderstandingAgent
from backend.agents.retrieval_agent import RetrievalAgent
from backend.agents.response_generation_agent import ResponseGenerationAgent
from backend.agents.clarification_agent import ClarificationAgent
from backend.agents.conversation_memory_agent import get_conversation_memory_agent
from backend.rag.confidence import calculate_retrieval_confidence
from backend.database.analytics_db import log_query_interaction
from backend.config import settings

logger = logging.getLogger(__name__)

class MultiAgentOrchestrator:
    """
    Multi-Agent Orchestrator (Milestone 3 & 4):
    Sequentially coordinates specialized agents:
    1. Conversation Memory Agent: tracks multi-turn session state, resolves coreference ('its' -> 'RAG'),
       handles context continuation ('renewal period' -> library policy), and isolates conversation
       memory completely from the permanent vector store.
    2. Query Understanding Agent: classifies query intent & calculates classification confidence.
    3. Clarification Agent: detects ambiguity, targeted missing context, and decomposes multi-part queries.
       If clarification is needed, halts before retrieval and asks the targeted follow-up question.
       If user clarifies, synthesizes the refined query.
    4. Retrieval Agent: performs semantic search, filters by relevance threshold, supports multi-part subqueries.
    5. Response Generation Agent: synthesizes strictly grounded answers from retrieved context.
    6. Response Transparency Panel: prepares supporting evidence chunks, source mappings, and confidence metrics.
    7. Query Analytics & Knowledge Gap Detection (M4.1): logs real interactions, identifies gaps, persists metrics.
    """
    def __init__(self):
        self.query_agent = QueryUnderstandingAgent()
        self.retrieval_agent = RetrievalAgent()
        self.response_agent = ResponseGenerationAgent()
        self.clarification_agent = ClarificationAgent()
        self.memory_agent = get_conversation_memory_agent()

    def process_query(
        self,
        query: str,
        top_k: int = 3,
        conversation_id: Optional[str] = None,
        user_clarification: Optional[str] = None,
        input_mode: str = "text"
    ) -> Dict[str, Any]:
        top_k = top_k if (top_k is not None and top_k > 0) else getattr(settings, 'TOP_K', 3)
        t_start = time.time()
        pipeline_trace = []
        original_input_query = (query or "").strip() if isinstance(query, str) else ""
        active_query = original_input_query
        refined_query_str = None
        clarification_info = None

        # Step 1: Conversation Memory Initialization & Resolution
        t_mem_0 = time.time()
        session_id = self.memory_agent.get_or_create_session(conversation_id)
        session = self.memory_agent.get_session(session_id)
        
        # Check if user is responding to a pending clarification
        pending_clarification = self.memory_agent.get_pending_clarification(session_id)
        if user_clarification or (pending_clarification and original_input_query != pending_clarification.get("original_query")):
            # If user_clarification is provided or user replied to the pending prompt
            user_response_text = user_clarification or original_input_query
            orig_q = pending_clarification.get("original_query", original_input_query) if pending_clarification else original_input_query
            clarify_q = pending_clarification.get("clarification_question") if pending_clarification else None
            
            refined_query_str = self.clarification_agent.refine_query(
                original_query=orig_q,
                user_clarification=user_response_text,
                clarification_question=clarify_q
            )
            active_query = refined_query_str
            self.memory_agent.clear_pending_clarification(session_id)
            
            clarification_info = {
                "clarification_required": False,
                "original_query": orig_q,
                "clarification_question": clarify_q,
                "missing_context": pending_clarification.get("missing_context") if pending_clarification else None,
                "awaiting_clarification": False,
                "clarification_response": user_response_text,
                "user_clarification": user_response_text,
                "refined_query": refined_query_str
            }
        else:
            # Memory Context Resolution: Check for coreference & context continuation
            resolved_q, was_resolved, topic = self.memory_agent.resolve_query_context(
                query=active_query,
                conversation_id=session_id
            )
            if was_resolved:
                active_query = resolved_q
                refined_query_str = resolved_q

        t_mem_1 = time.time()
        pipeline_trace.append({
            "agent_name": "Conversation Memory Agent",
            "status": "completed",
            "details": f"Session {session_id[:8]}... Active topic: '{session.get('active_topic')}'. Query resolved: {active_query != original_input_query}",
            "duration_ms": round((t_mem_1 - t_mem_0) * 1000, 2)
        })

        # Step 2: Clarification Agent - Evaluate Ambiguity
        t_clar_0 = time.time()
        ambiguity_eval = self.clarification_agent.evaluate_ambiguity(
            query=active_query,
            conversation_context=session
        )
        t_clar_1 = time.time()

        if ambiguity_eval["clarification_required"] and not user_clarification:
            clarification_question = ambiguity_eval["clarification_question"]
            # Save pending clarification in conversation memory
            self.memory_agent.set_pending_clarification(session_id, ambiguity_eval)
            
            pipeline_trace.append({
                "agent_name": "Clarification Agent",
                "status": "completed",
                "details": f"Ambiguity detected: {ambiguity_eval.get('missing_context')}. Asking follow-up question.",
                "duration_ms": round((t_clar_1 - t_clar_0) * 1000, 2)
            })

            # Record turn in memory
            self.memory_agent.record_turn(
                conversation_id=session_id,
                query=original_input_query,
                response=clarification_question,
                query_type="ambiguous",
                confidence="Low"
            )

            clarification_info = {
                "clarification_required": True,
                "original_query": original_input_query,
                "clarification_question": clarification_question,
                "missing_context": ambiguity_eval.get("missing_context"),
                "awaiting_clarification": True,
                "clarification_response": None,
                "user_clarification": None,
                "refined_query": None
            }

            memory_ctx = {
                "topic": session.get("active_topic"),
                "entities": self.memory_agent.extract_entities(session),
                "referenced_documents": session.get("referenced_documents", []),
                "relevant_previous_queries": [m["content"] for m in session.get("messages", []) if m.get("role") == "user"][-3:],
                "relevant_previous_answers": [m["content"] for m in session.get("messages", []) if m.get("role") == "assistant"][-3:],
                "clarification_context": clarification_info
            }

            # Safe analytics logging for clarification
            try:
                log_query_interaction(
                    query_text=original_input_query,
                    query_type="ambiguous",
                    domain=session.get("active_topic") or "General",
                    resolution_status="CLARIFICATION_REQUIRED",
                    confidence="Low",
                    response_latency=round((time.time() - t_start) * 1000, 2),
                    generated_response=clarification_question,
                    conversation_id=session_id,
                    clarification_required=True,
                    clarification_count=1,
                    retrieved_documents=[],
                    retrieved_chunks=0,
                    retrieval_scores=[],
                    input_mode=input_mode,
                    knowledge_gap=False,
                    failure_reason=ambiguity_eval.get("missing_context")
                )
            except Exception as log_err:
                logger.error(f"Analytics logging failed: {log_err}", exc_info=True)

            return {
                "conversation_id": session_id,
                "query": original_input_query,
                "query_type": "ambiguous",
                "classification_confidence": 0.90,
                "route": "clarification_required",
                "clarification_required": True,
                "clarification_question": clarification_question,
                "clarification": clarification_info,
                "refined_query": None,
                "retrieval": {
                    "top_k": top_k,
                    "results": [],
                    "no_sufficient_information": True
                },
                "retrieved_chunks": [],
                "response": clarification_question,
                "answer": clarification_question,
                "confidence": "Low",
                "sources": [],
                "transparency": {
                    "supporting_chunks": [],
                    "has_sufficient_evidence": False,
                    "confidence_rationale": "Clarification required before knowledge retrieval."
                },
                "active_topic": session.get("active_topic"),
                "memory_context": memory_ctx,
                "pipeline_trace": pipeline_trace,
                "knowledge_gap": False,
                "resolution_status": "CLARIFICATION_REQUIRED"
            }

        # Step 3: Query Understanding Agent
        t0 = time.time()
        classification = self.query_agent.classify(active_query)
        t1 = time.time()
        pipeline_trace.append({
            "agent_name": "Query Understanding Agent",
            "status": "completed",
            "details": f"Classified as '{classification['query_type']}' (confidence: {classification['classification_confidence']})",
            "duration_ms": round((t1 - t0) * 1000, 2)
        })

        query_type = classification["query_type"]
        confidence_val = classification["classification_confidence"]
        route = "retrieval"

        # Step 4: Retrieval Agent (supporting multi-part subqueries if present)
        t2 = time.time()
        subqueries = ambiguity_eval.get("multipart_subqueries")
        retrieval_output = self.retrieval_agent.retrieve(
            query=active_query,
            query_type=query_type,
            top_k=top_k,
            subqueries=subqueries
        )
        t3 = time.time()
        num_chunks = len(retrieval_output["results"])
        pipeline_trace.append({
            "agent_name": "Retrieval Agent",
            "status": "completed",
            "details": f"Retrieved {num_chunks} chunks (no_sufficient_info: {retrieval_output['no_sufficient_information']})",
            "duration_ms": round((t3 - t2) * 1000, 2)
        })

        # Step 5: Response Generation Agent
        t4 = time.time()
        final_answer = self.response_agent.generate_response(
            query=active_query,
            query_type=query_type,
            retrieved_chunks=retrieval_output["results"],
            no_sufficient_info=retrieval_output["no_sufficient_information"]
        )
        t5 = time.time()
        pipeline_trace.append({
            "agent_name": "Response Generation Agent",
            "status": "completed",
            "details": "Synthesized grounded response strictly with retrieved context.",
            "duration_ms": round((t5 - t4) * 1000, 2)
        })

        # Step 6: Confidence Calculation & Transparency Assembly
        is_insufficient = (
            retrieval_output["no_sufficient_information"]
            or "couldn't find sufficient information" in final_answer.lower()
            or not retrieval_output["results"]
        )
        if is_insufficient:
            confidence_level = "Low"
            confidence_rationale = "Limited supporting evidence was found in the knowledge base."
        else:
            confidence_level = calculate_retrieval_confidence(retrieval_output["results"])
            confidence_rationale = f"Determined by vector similarity distance of top retrieved evidence chunks."

        # Supporting Chunks for Transparency Panel
        supporting_chunks = []
        sources = []
        if not is_insufficient:
            for chunk in retrieval_output["results"]:
                chunk_data = {
                    "document_name": chunk["document_name"],
                    "chunk_id": chunk["chunk_id"],
                    "content": chunk["content"],
                    "relevance_score": chunk["relevance_score"],
                    "distance": chunk.get("distance"),
                    "page_number": chunk.get("page_number"),
                    "section": chunk.get("section"),
                    "document_id": chunk.get("document_id")
                }
                supporting_chunks.append(chunk_data)
                sources.append({
                    "document_name": chunk["document_name"],
                    "chunk_id": chunk["chunk_id"],
                    "relevance_score": chunk["relevance_score"],
                    "page_number": chunk.get("page_number"),
                    "section": chunk.get("section")
                })

        transparency_data = {
            "supporting_chunks": supporting_chunks,
            "has_sufficient_evidence": not is_insufficient,
            "confidence_rationale": confidence_rationale
        }

        # Step 7: Record completed turn in Conversation Memory
        self.memory_agent.record_turn(
            conversation_id=session_id,
            query=original_input_query,
            response=final_answer,
            query_type=query_type,
            confidence=confidence_level,
            referenced_documents=[s["document_name"] for s in sources]
        )

        session_updated = self.memory_agent.get_session(session_id)
        current_active_topic = session_updated.get("active_topic") if session_updated else None

        memory_ctx = {
            "topic": current_active_topic,
            "entities": self.memory_agent.extract_entities(session_updated),
            "referenced_documents": session_updated.get("referenced_documents", []) if session_updated else [],
            "relevant_previous_queries": [m["content"] for m in session_updated.get("messages", []) if m.get("role") == "user"][-3:] if session_updated else [],
            "relevant_previous_answers": [m["content"] for m in session_updated.get("messages", []) if m.get("role") == "assistant"][-3:] if session_updated else [],
            "clarification_context": clarification_info
        }

        # Determine Knowledge Gap and Resolution Status (Milestone 4.1)
        total_latency_ms = round((time.time() - t_start) * 1000, 2)
        is_knowledge_gap = is_insufficient
        if is_knowledge_gap:
            resolution_status = "UNANSWERED"
            threshold_val = getattr(settings, 'SIMILARITY_THRESHOLD', 0.35)
            failure_reason = f"No relevant chunks above similarity threshold ({threshold_val}) found in knowledge base."
        elif confidence_level == "Low":
            resolution_status = "LOW_CONFIDENCE"
            failure_reason = "Low confidence retrieval match."
        else:
            resolution_status = "ANSWERED"
            failure_reason = None

        # Safe analytics logging (never interrupts main pipeline)
        try:
            log_query_interaction(
                query_text=original_input_query,
                query_type=query_type,
                domain=current_active_topic or session.get("active_topic") or "General",
                resolution_status=resolution_status,
                confidence=confidence_level,
                response_latency=total_latency_ms,
                generated_response=final_answer,
                conversation_id=session_id,
                clarification_required=False,
                clarification_count=0,
                retrieved_documents=list(set(c["document_name"] for c in retrieval_output["results"])),
                retrieved_chunks=len(retrieval_output["results"]),
                retrieval_scores=[c["relevance_score"] for c in retrieval_output["results"]],
                input_mode=input_mode,
                knowledge_gap=is_knowledge_gap,
                failure_reason=failure_reason
            )
        except Exception as log_err:
            logger.error(f"Analytics logging failed: {log_err}", exc_info=True)

        return {
            "conversation_id": session_id,
            "query": original_input_query,
            "query_type": query_type,
            "classification_confidence": confidence_val,
            "route": route,
            "clarification_required": False,
            "clarification_question": None,
            "clarification": clarification_info,
            "refined_query": refined_query_str,
            "retrieval": retrieval_output,
            "retrieved_chunks": retrieval_output["results"],
            "response": final_answer,
            "answer": final_answer,
            "confidence": confidence_level,
            "sources": sources,
            "transparency": transparency_data,
            "active_topic": current_active_topic,
            "memory_context": memory_ctx,
            "pipeline_trace": pipeline_trace,
            "knowledge_gap": is_knowledge_gap,
            "resolution_status": resolution_status
        }

_orchestrator_instance = None

def get_orchestrator() -> MultiAgentOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = MultiAgentOrchestrator()
    return _orchestrator_instance

AgentOrchestrator = MultiAgentOrchestrator
