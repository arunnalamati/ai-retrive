import time
from typing import Dict, Any, List
from backend.agents.query_understanding_agent import QueryUnderstandingAgent
from backend.agents.retrieval_agent import RetrievalAgent
from backend.agents.response_generation_agent import ResponseGenerationAgent
from backend.agents.clarification_agent import ClarificationAgent
from backend.agents.conversation_memory_agent import ConversationMemoryAgent
from backend.rag.confidence import calculate_retrieval_confidence

class MultiAgentOrchestrator:
    """
    Multi-Agent Orchestrator:
    Sequentially coordinates specialized agents:
    1. Query Understanding Agent: classifies query type & routing.
    2. Retrieval Agent: performs semantic search, filters by threshold.
    3. Response Generation Agent: synthesizes grounded answer.
    4. Clarification Agent: handles ambiguous queries.
    5. Conversation Memory Agent: records turn history.
    """
    def __init__(self):
        self.query_agent = QueryUnderstandingAgent()
        self.retrieval_agent = RetrievalAgent()
        self.response_agent = ResponseGenerationAgent()
        self.clarification_agent = ClarificationAgent()
        self.memory_agent = ConversationMemoryAgent()

    def process_query(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        pipeline_trace = []
        
        # Step 1: Query Understanding Agent
        t0 = time.time()
        classification = self.query_agent.classify(query)
        t1 = time.time()
        pipeline_trace.append({
            "agent_name": "Query Understanding Agent",
            "status": "completed",
            "details": f"Classified as '{classification['query_type']}' (confidence: {classification['classification_confidence']})",
            "duration_ms": round((t1 - t0) * 1000, 2)
        })

        query_type = classification["query_type"]
        confidence_val = classification["classification_confidence"]
        route = classification["route"]

        # Step 2: Ambiguous Route Check
        if route == "clarification_required":
            t2 = time.time()
            clarification_text = self.clarification_agent.formulate_clarification(
                query, classification.get("reasoning")
            )
            t3 = time.time()
            pipeline_trace.append({
                "agent_name": "Clarification Agent",
                "status": "completed",
                "details": "Clarification requested due to ambiguous intent.",
                "duration_ms": round((t3 - t2) * 1000, 2)
            })

            # Record in memory
            self.memory_agent.record_turn(query, clarification_text, query_type, "Low")

            return {
                "query": query,
                "query_type": query_type,
                "classification_confidence": confidence_val,
                "route": route,
                "retrieval": {
                    "top_k": top_k,
                    "results": [],
                    "no_sufficient_information": True
                },
                "response": clarification_text,
                "confidence": "Low",
                "sources": [],
                "pipeline_trace": pipeline_trace
            }

        # Step 3: Retrieval Agent
        t2 = time.time()
        retrieval_output = self.retrieval_agent.retrieve(
            query=query,
            query_type=query_type,
            top_k=top_k
        )
        t3 = time.time()
        num_chunks = len(retrieval_output["results"])
        pipeline_trace.append({
            "agent_name": "Retrieval Agent",
            "status": "completed",
            "details": f"Retrieved {num_chunks} chunks (no_sufficient_info: {retrieval_output['no_sufficient_information']})",
            "duration_ms": round((t3 - t2) * 1000, 2)
        })

        # Step 4: Response Generation Agent
        t4 = time.time()
        final_answer = self.response_agent.generate_response(
            query=query,
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

        # Step 5: Confidence Calculation
        if (
            retrieval_output["no_sufficient_information"]
            or "couldn't find sufficient information" in final_answer.lower()
        ):
            confidence_level = "Low"
        else:
            confidence_level = calculate_retrieval_confidence(retrieval_output["results"])

        # Step 6: Format Sources
        sources: List[Dict[str, Any]] = []
        if not retrieval_output["no_sufficient_information"] and "couldn't find sufficient information" not in final_answer.lower():
            for chunk in retrieval_output["results"]:
                sources.append({
                    "document_name": chunk["document_name"],
                    "chunk_id": chunk["chunk_id"],
                    "relevance_score": chunk["relevance_score"],
                    "page_number": chunk.get("page_number"),
                    "section": chunk.get("section")
                })

        # Record in memory
        self.memory_agent.record_turn(query, final_answer, query_type, confidence_level)

        return {
            "query": query,
            "query_type": query_type,
            "classification_confidence": confidence_val,
            "route": route,
            "retrieval": retrieval_output,
            "response": final_answer,
            "confidence": confidence_level,
            "sources": sources,
            "pipeline_trace": pipeline_trace
        }

_orchestrator_instance = None

def get_orchestrator() -> MultiAgentOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = MultiAgentOrchestrator()
    return _orchestrator_instance
