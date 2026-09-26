from typing import Optional
from fastapi import APIRouter, HTTPException
from backend.models.query_models import QueryRequest
from backend.models.response_models import QueryResponse
from backend.agents.orchestrator import get_orchestrator
from backend.agents.conversation_memory_agent import get_conversation_memory_agent

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def execute_query(request: QueryRequest):
    query_text = request.query.strip()
    if not query_text and not request.user_clarification:
        raise HTTPException(status_code=400, detail="Query string or user clarification cannot be empty.")

    orchestrator = get_orchestrator()
    try:
        response = orchestrator.process_query(
            query=query_text,
            top_k=request.top_k,
            conversation_id=request.conversation_id,
            user_clarification=request.user_clarification
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query orchestration failed: {str(e)}")

@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Retrieve session state and recent interaction turns."""
    memory_agent = get_conversation_memory_agent()
    session = memory_agent.get_session(conversation_id)
    if not session:
        return {
            "conversation_id": conversation_id,
            "messages": [],
            "active_topic": None,
            "referenced_documents": [],
            "pending_clarification": None
        }
    return {
        "conversation_id": conversation_id,
        "messages": session.get("messages", []),
        "active_topic": session.get("active_topic"),
        "referenced_documents": session.get("referenced_documents", []),
        "pending_clarification": session.get("pending_clarification")
    }

@router.delete("/conversations/{conversation_id}")
async def clear_conversation(conversation_id: str):
    """Clear memory history for a given conversation session."""
    memory_agent = get_conversation_memory_agent()
    memory_agent.clear(conversation_id)
    return {"status": "ok", "message": f"Conversation session '{conversation_id}' cleared."}
