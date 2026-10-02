from typing import Optional
from fastapi import APIRouter, Query
from backend.database.analytics_db import (
    get_analytics_summary,
    get_analytics_queries,
    get_unanswered_queries,
    get_knowledge_gaps,
    get_themes,
    get_confidence_distribution,
    get_query_trends,
    get_type_distribution,
    get_domain_distribution
)

router = APIRouter(prefix="/analytics", tags=["Query Analytics"])

@router.get("/summary")
async def get_summary(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    query_type: Optional[str] = Query(None, description="Filter by query type"),
    status: Optional[str] = Query(None, description="Filter by resolution status"),
    confidence: Optional[str] = Query(None, description="Filter by confidence"),
    start_date: Optional[str] = Query(None, description="Filter from timestamp"),
    end_date: Optional[str] = Query(None, description="Filter until timestamp")
):
    """Retrieve overall query analytics summary metrics."""
    return get_analytics_summary(
        domain=domain,
        query_type=query_type,
        status=status,
        confidence=confidence,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/queries")
async def list_queries(
    domain: Optional[str] = Query(None),
    query_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    confidence: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Retrieve filtered, paginated query interaction records."""
    records = get_analytics_queries(
        domain=domain,
        query_type=query_type,
        status=status,
        confidence=confidence,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    return {"total": len(records), "queries": records}

@router.get("/unanswered")
async def list_unanswered(
    limit: int = Query(50, ge=1, le=200),
    domain: Optional[str] = Query(None, description="Filter by domain")
):
    """Retrieve unanswered or low-confidence queries."""
    records = get_unanswered_queries(limit=limit, domain=domain)
    return {"total": len(records), "unanswered_queries": records}

@router.get("/knowledge-gaps")
async def list_knowledge_gaps(
    limit: int = Query(50, ge=1, le=200),
    domain: Optional[str] = Query(None, description="Filter by domain")
):
    """Retrieve identified knowledge gaps where information was missing."""
    records = get_knowledge_gaps(limit=limit, domain=domain)
    return {"total": len(records), "knowledge_gaps": records}

@router.get("/themes")
async def list_themes(
    limit: int = Query(20, ge=1, le=50),
    domain: Optional[str] = Query(None, description="Filter by domain")
):
    """Retrieve aggregated recurring query themes."""
    records = get_themes(limit=limit, domain=domain)
    return {"themes": records}

@router.get("/confidence")
async def get_confidence_stats(domain: Optional[str] = Query(None, description="Filter by domain")):
    """Retrieve confidence distribution counts."""
    return get_confidence_distribution(domain=domain)

@router.get("/trends")
async def get_trends(
    days: int = Query(7, ge=1, le=30),
    domain: Optional[str] = Query(None, description="Filter by domain")
):
    """Retrieve daily query trend volume."""
    return {"trends": get_query_trends(limit_days=days, domain=domain)}

@router.get("/distributions")
async def get_all_distributions(domain: Optional[str] = Query(None, description="Filter by domain")):
    """Retrieve combined distribution stats for the dashboard charts."""
    return {
        "confidence": get_confidence_distribution(domain=domain),
        "query_types": get_type_distribution(domain=domain),
        "domains": get_domain_distribution()
    }
