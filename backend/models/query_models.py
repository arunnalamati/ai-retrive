from typing import Optional, Literal
from pydantic import BaseModel, Field

QueryType = Literal["factual", "procedural", "comparative", "ambiguous"]
QueryRoute = Literal["retrieval", "clarification_required"]

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The user question or search prompt")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of top chunks to retrieve")

class QueryUnderstandingResponse(BaseModel):
    query: str
    query_type: QueryType
    classification_confidence: float = Field(..., ge=0.0, le=1.0)
    route: QueryRoute
    reasoning: Optional[str] = None
