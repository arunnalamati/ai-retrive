from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

ConfidenceLevel = Literal["High", "Medium", "Low"]

class RetrievalChunk(BaseModel):
    document_name: str
    chunk_id: str
    content: str
    relevance_score: float
    page_number: Optional[int] = None
    section: Optional[str] = None
    document_id: Optional[str] = None

class RetrievalResult(BaseModel):
    top_k: int
    results: List[RetrievalChunk]
    no_sufficient_information: bool = False

class SourceInfo(BaseModel):
    document_name: str
    chunk_id: str
    relevance_score: float
    page_number: Optional[int] = None
    section: Optional[str] = None

class AgentStepTrace(BaseModel):
    agent_name: str
    status: Literal["idle", "processing", "completed", "error"]
    details: Optional[str] = None
    duration_ms: Optional[float] = None

class QueryResponse(BaseModel):
    query: str
    query_type: str
    classification_confidence: float
    route: str
    retrieval: RetrievalResult
    response: str
    confidence: ConfidenceLevel
    sources: List[SourceInfo]
    pipeline_trace: Optional[List[AgentStepTrace]] = None
