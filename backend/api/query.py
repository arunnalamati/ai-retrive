from fastapi import APIRouter, HTTPException
from backend.models.query_models import QueryRequest
from backend.models.response_models import QueryResponse
from backend.agents.orchestrator import get_orchestrator

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def execute_query(request: QueryRequest):
    query_text = request.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")

    orchestrator = get_orchestrator()
    try:
        response = orchestrator.process_query(
            query=query_text,
            top_k=request.top_k
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query orchestration failed: {str(e)}")
