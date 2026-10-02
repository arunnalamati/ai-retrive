from typing import Optional, Literal
from pydantic import BaseModel, Field

QueryType = Literal["factual", "procedural", "comparative", "ambiguous", "multi_part", "follow_up"]
QueryRoute = Literal["retrieval", "clarification_required"]

class QueryRequest(BaseModel):
    query: Optional[str] = Field(default="", description="The user question or search prompt")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of top chunks to retrieve")
    conversation_id: Optional[str] = Field(default=None, description="Optional conversation session ID")
    user_clarification: Optional[str] = Field(default=None, description="User's clarification response if answering a follow-up")
    input_mode: Optional[str] = Field(default="text", description="Input mode: 'text' or 'voice'")

class ClarificationState(BaseModel):
    conversation_id: Optional[str] = None
    original_query: str
    clarification_required: bool = False
    clarification_question: Optional[str] = None
    missing_context: Optional[str] = None
    awaiting_clarification: bool = False
    clarification_response: Optional[str] = None
    user_clarification: Optional[str] = None
    refined_query: Optional[str] = None

class QueryUnderstandingResponse(BaseModel):
    query: str
    query_type: QueryType
    classification_confidence: float = Field(..., ge=0.0, le=1.0)
    route: QueryRoute
    reasoning: Optional[str] = None
