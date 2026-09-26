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

class ClarificationInfo(BaseModel):
    clarification_required: bool = False
    original_query: Optional[str] = None
    clarification_question: Optional[str] = None
    missing_context: Optional[str] = None
    awaiting_clarification: bool = False
    clarification_response: Optional[str] = None
    user_clarification: Optional[str] = None
    refined_query: Optional[str] = None

class TransparencyChunk(BaseModel):
    document_name: str
    chunk_id: str
    content: str
    relevance_score: float
    distance: Optional[float] = None
    page_number: Optional[int] = None
    section: Optional[str] = None
    document_id: Optional[str] = None

class TransparencyResult(BaseModel):
    supporting_chunks: List[TransparencyChunk] = []
    has_sufficient_evidence: bool = True
    confidence_rationale: Optional[str] = None

class QueryResponse(BaseModel):
    conversation_id: Optional[str] = None
    query: str
    query_type: str
    classification_confidence: float
    route: str
    clarification_required: bool = False
    clarification_question: Optional[str] = None
    clarification: Optional[ClarificationInfo] = None
    refined_query: Optional[str] = None
    retrieval: RetrievalResult
    retrieved_chunks: Optional[List[RetrievalChunk]] = None
    response: str
    answer: Optional[str] = None
    confidence: ConfidenceLevel
    sources: List[SourceInfo]
    transparency: Optional[TransparencyResult] = None
    active_topic: Optional[str] = None
    memory_context: Optional[Dict[str, Any]] = None
    pipeline_trace: Optional[List[AgentStepTrace]] = None
