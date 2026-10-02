import sqlite3
import json
import logging
import uuid
from typing import Dict, Any, List, Optional
from backend.config import settings
from backend.utils import current_iso_timestamp

logger = logging.getLogger(__name__)

def get_analytics_connection():
    conn = sqlite3.connect(settings.SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_analytics_db():
    """Initializes the query_analytics SQLite table."""
    try:
        conn = get_analytics_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS query_analytics (
                query_id TEXT PRIMARY KEY,
                conversation_id TEXT,
                timestamp TEXT NOT NULL,
                query_text TEXT NOT NULL,
                query_type TEXT NOT NULL,
                domain TEXT,
                theme TEXT,
                resolution_status TEXT NOT NULL,
                clarification_required INTEGER NOT NULL DEFAULT 0,
                clarification_count INTEGER NOT NULL DEFAULT 0,
                retrieved_documents TEXT,
                retrieved_chunks INTEGER NOT NULL DEFAULT 0,
                retrieval_scores TEXT,
                confidence TEXT NOT NULL,
                response_latency REAL NOT NULL DEFAULT 0.0,
                input_mode TEXT NOT NULL DEFAULT 'text',
                generated_response TEXT,
                knowledge_gap INTEGER NOT NULL DEFAULT 0,
                failure_reason TEXT
            )
        """)
        # Index for efficient filtering
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON query_analytics (timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_domain ON query_analytics (domain)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_status ON query_analytics (resolution_status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_knowledge_gap ON query_analytics (knowledge_gap)")
        conn.commit()
        conn.close()
        logger.info("query_analytics table verified/initialized in SQLite.")
    except Exception as e:
        logger.error(f"Failed to initialize query_analytics table: {e}")

# Automatically initialize on module import
init_analytics_db()

def log_query_interaction(
    query_text: str,
    query_type: str,
    domain: Optional[str],
    resolution_status: str,
    confidence: str,
    response_latency: float,
    generated_response: str,
    conversation_id: Optional[str] = None,
    clarification_required: bool = False,
    clarification_count: int = 0,
    retrieved_documents: Optional[List[str]] = None,
    retrieved_chunks: int = 0,
    retrieval_scores: Optional[List[float]] = None,
    input_mode: str = "text",
    knowledge_gap: bool = False,
    failure_reason: Optional[str] = None,
    theme: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Safely stores a query interaction into SQLite.
    Never raises an uncaught exception to ensure the main RAG pipeline is never interrupted.
    """
    try:
        query_id = str(uuid.uuid4())
        ts = current_iso_timestamp()
        
        # Infer theme if not provided
        inferred_theme = theme or _derive_theme(query_text, domain)

        docs_json = json.dumps(retrieved_documents or [])
        scores_json = json.dumps(retrieval_scores or [])

        conn = get_analytics_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO query_analytics (
                query_id, conversation_id, timestamp, query_text, query_type,
                domain, theme, resolution_status, clarification_required, clarification_count,
                retrieved_documents, retrieved_chunks, retrieval_scores, confidence,
                response_latency, input_mode, generated_response, knowledge_gap, failure_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            query_id,
            conversation_id,
            ts,
            query_text,
            query_type,
            domain or "General",
            inferred_theme,
            resolution_status,
            1 if clarification_required else 0,
            clarification_count,
            docs_json,
            retrieved_chunks,
            scores_json,
            confidence,
            round(response_latency, 2),
            input_mode,
            generated_response,
            1 if knowledge_gap else 0,
            failure_reason
        ))
        conn.commit()
        conn.close()

        return {
            "query_id": query_id,
            "conversation_id": conversation_id,
            "timestamp": ts,
            "query_text": query_text,
            "query_type": query_type,
            "domain": domain or "General",
            "theme": inferred_theme,
            "resolution_status": resolution_status,
            "clarification_required": clarification_required,
            "clarification_count": clarification_count,
            "retrieved_documents": retrieved_documents or [],
            "retrieved_chunks": retrieved_chunks,
            "retrieval_scores": retrieval_scores or [],
            "confidence": confidence,
            "response_latency": response_latency,
            "input_mode": input_mode,
            "generated_response": generated_response,
            "response_text": generated_response,
            "knowledge_gap": knowledge_gap,
            "failure_reason": failure_reason
        }
    except Exception as e:
        logger.error(f"Error logging analytics interaction: {e}", exc_info=True)
        return None

def _derive_theme(query_text: str, domain: Optional[str]) -> str:
    """Heuristic identification of recurring topic themes."""
    q_low = query_text.lower()
    
    # Library themes
    if any(w in q_low for w in ["borrow", "borrowing", "how many books"]):
        return "Book Borrowing"
    if any(w in q_low for w in ["renew", "renewal"]):
        return "Book Renewal"
    if any(w in q_low for w in ["fine", "fines", "late fee", "overdue"]):
        return "Late Return Fines"
    if any(w in q_low for w in ["lost", "damaged", "replacement"]):
        return "Lost Book Policy"
    if any(w in q_low for w in ["digital", "e-book", "journal", "database"]):
        return "Digital Resources"

    # Hostel themes
    if any(w in q_low for w in ["refund", "deposit", "caution deposit"]):
        return "Hostel Refund"
    if any(w in q_low for w in ["curfew", "timing", "gate", "night"]):
        return "Gate & Curfew Timings"
    if any(w in q_low for w in ["mess", "food", "dining", "meal"]):
        return "Mess Regulations"
    if any(w in q_low for w in ["room", "allocation", "allotment", "occupancy"]):
        return "Room Allocation"
    if any(w in q_low for w in ["visitor", "guest", "parent"]):
        return "Visitor Policy"

    # Academic / Examination themes
    if any(w in q_low for w in ["attendance", "75%", "shortage"]):
        return "Attendance Requirement"
    if any(w in q_low for w in ["revaluation", "re-evaluation", "rechecking", "scrutiny"]):
        return "Revaluation Procedure"
    if any(w in q_low for w in ["grade", "grading", "gpa", "cgpa", "scale"]):
        return "Grading Scale"
    if any(w in q_low for w in ["makeup", "supplementary", "arrear", "backlog"]):
        return "Supplementary Exams"
    if any(w in q_low for w in ["malpractice", "unfair", "cheating"]):
        return "Malpractice Penalties"

    # Technical / RAG themes
    if any(w in q_low for w in ["rag", "architecture", "retrieval"]):
        return "RAG Architecture"
    if any(w in q_low for w in ["embedding", "vector", "sentence"]):
        return "Embeddings & Vectors"
    if any(w in q_low for w in ["chunk", "chunking", "overlap"]):
        return "Document Chunking"

    return domain if domain and domain != "General" else "General Inquiries"

def get_analytics_summary(
    domain: Optional[str] = None,
    query_type: Optional[str] = None,
    status: Optional[str] = None,
    confidence: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """Computes overall aggregate system metrics with optional filtering."""
    conn = get_analytics_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if domain:
        conditions.append("domain = ?")
        params.append(domain)
    if query_type:
        conditions.append("query_type = ?")
        params.append(query_type)
    if status:
        conditions.append("resolution_status = ?")
        params.append(status)
    if confidence:
        conditions.append("confidence = ?")
        params.append(confidence)
    if start_date:
        conditions.append("timestamp >= ?")
        params.append(start_date)
    if end_date:
        conditions.append("timestamp <= ?")
        params.append(end_date)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    cursor.execute(f"""
        SELECT
            COUNT(*) as total_queries,
            SUM(CASE WHEN resolution_status = 'ANSWERED' THEN 1 ELSE 0 END) as answered,
            SUM(CASE WHEN resolution_status = 'UNANSWERED' THEN 1 ELSE 0 END) as unanswered,
            SUM(CASE WHEN resolution_status = 'LOW_CONFIDENCE' THEN 1 ELSE 0 END) as low_confidence,
            SUM(CASE WHEN clarification_required = 1 THEN 1 ELSE 0 END) as clarification_count,
            SUM(CASE WHEN knowledge_gap = 1 THEN 1 ELSE 0 END) as knowledge_gap_count,
            AVG(response_latency) as avg_latency,
            AVG(CASE 
                WHEN confidence = 'High' THEN 1.0 
                WHEN confidence = 'Medium' THEN 0.7 
                WHEN confidence = 'Low' THEN 0.3 
                ELSE 0.0 END) as avg_confidence_score
        FROM query_analytics
        {where_clause}
    """, params)
    
    row = cursor.fetchone()
    conn.close()

    total = row["total_queries"] or 0
    return {
        "total_queries": total,
        "answered": row["answered"] or 0,
        "unanswered": row["unanswered"] or 0,
        "low_confidence": row["low_confidence"] or 0,
        "clarification_count": row["clarification_count"] or 0,
        "knowledge_gap_count": row["knowledge_gap_count"] or 0,
        "avg_response_latency_ms": round(row["avg_latency"] or 0.0, 2),
        "avg_confidence": round(row["avg_confidence_score"] or 0.0, 3)
    }

def get_analytics_queries(
    domain: Optional[str] = None,
    query_type: Optional[str] = None,
    status: Optional[str] = None,
    confidence: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """Returns paginated query records."""
    conn = get_analytics_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if domain:
        conditions.append("domain = ?")
        params.append(domain)
    if query_type:
        conditions.append("query_type = ?")
        params.append(query_type)
    if status:
        conditions.append("resolution_status = ?")
        params.append(status)
    if confidence:
        conditions.append("confidence = ?")
        params.append(confidence)
    if start_date:
        conditions.append("timestamp >= ?")
        params.append(start_date)
    if end_date:
        conditions.append("timestamp <= ?")
        params.append(end_date)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    params.extend([limit, offset])

    cursor.execute(f"""
        SELECT * FROM query_analytics
        {where_clause}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    """, params)

    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        d["clarification_required"] = bool(d["clarification_required"])
        d["knowledge_gap"] = bool(d["knowledge_gap"])
        d["response_text"] = d.get("generated_response")
        try:
            d["retrieved_documents"] = json.loads(d["retrieved_documents"] or "[]")
        except Exception:
            d["retrieved_documents"] = []
        try:
            d["retrieval_scores"] = json.loads(d["retrieval_scores"] or "[]")
        except Exception:
            d["retrieval_scores"] = []
        results.append(d)

    return results

def get_unanswered_queries(limit: int = 50, domain: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetches queries marked as UNANSWERED or LOW_CONFIDENCE."""
    conn = get_analytics_connection()
    cursor = conn.cursor()
    params = []
    where_extra = ""
    if domain:
        where_extra = "AND domain = ?"
        params.append(domain)
    params.append(limit)

    cursor.execute(f"""
        SELECT * FROM query_analytics
        WHERE (resolution_status IN ('UNANSWERED', 'LOW_CONFIDENCE')
           OR knowledge_gap = 1)
           {where_extra}
        ORDER BY timestamp DESC
        LIMIT ?
    """, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        d["knowledge_gap"] = bool(d["knowledge_gap"])
        d["clarification_required"] = bool(d["clarification_required"])
        d["response_text"] = d.get("generated_response")
        results.append(d)
    return results

def get_knowledge_gaps(limit: int = 50, domain: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetches explicitly identified knowledge gaps."""
    conn = get_analytics_connection()
    cursor = conn.cursor()
    params = []
    where_extra = ""
    if domain:
        where_extra = "AND domain = ?"
        params.append(domain)
    params.append(limit)

    cursor.execute(f"""
        SELECT query_id, timestamp, query_text, domain, theme, failure_reason, confidence, retrieved_chunks, generated_response as response_text
        FROM query_analytics
        WHERE knowledge_gap = 1
        {where_extra}
        ORDER BY timestamp DESC
        LIMIT ?
    """, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_themes(limit: int = 20, domain: Optional[str] = None) -> List[Dict[str, Any]]:
    """Aggregates queries by theme."""
    conn = get_analytics_connection()
    cursor = conn.cursor()
    params = []
    where_extra = ""
    if domain:
        where_extra = "AND domain = ?"
        params.append(domain)
    params.append(limit)

    cursor.execute(f"""
        SELECT theme, COUNT(*) as query_count, 
               SUM(CASE WHEN resolution_status = 'ANSWERED' THEN 1 ELSE 0 END) as answered_count,
               SUM(CASE WHEN knowledge_gap = 1 THEN 1 ELSE 0 END) as knowledge_gap_count
        FROM query_analytics
        WHERE theme IS NOT NULL AND theme != ''
        {where_extra}
        GROUP BY theme
        ORDER BY query_count DESC
        LIMIT ?
    """, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_confidence_distribution(domain: Optional[str] = None) -> Dict[str, int]:
    """Returns counts of High, Medium, Low confidence queries."""
    conn = get_analytics_connection()
    cursor = conn.cursor()
    params = []
    where_extra = ""
    if domain:
        where_extra = "WHERE domain = ?"
        params.append(domain)

    cursor.execute(f"""
        SELECT confidence, COUNT(*) as count
        FROM query_analytics
        {where_extra}
        GROUP BY confidence
    """, params)
    rows = cursor.fetchall()
    conn.close()
    dist = {"High": 0, "Medium": 0, "Low": 0}
    for r in rows:
        c = r["confidence"]
        if c in dist:
            dist[c] = r["count"]
    return dist

def get_type_distribution(domain: Optional[str] = None) -> Dict[str, int]:
    """Returns counts of queries grouped by query_type."""
    conn = get_analytics_connection()
    cursor = conn.cursor()
    params = []
    where_extra = ""
    if domain:
        where_extra = "WHERE domain = ?"
        params.append(domain)

    cursor.execute(f"""
        SELECT query_type, COUNT(*) as count
        FROM query_analytics
        {where_extra}
        GROUP BY query_type
    """, params)
    rows = cursor.fetchall()
    conn.close()
    return {r["query_type"]: r["count"] for r in rows}

def get_domain_distribution() -> Dict[str, int]:
    """Returns counts of queries grouped by domain."""
    conn = get_analytics_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COALESCE(domain, 'General') as domain_name, COUNT(*) as count
        FROM query_analytics
        GROUP BY domain_name
    """)
    rows = cursor.fetchall()
    conn.close()
    return {r["domain_name"]: r["count"] for r in rows}

def get_query_trends(limit_days: int = 7, domain: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns daily query volume trend."""
    conn = get_analytics_connection()
    cursor = conn.cursor()
    params = []
    where_extra = ""
    if domain:
        where_extra = "WHERE domain = ?"
        params.append(domain)
    params.append(limit_days)

    cursor.execute(f"""
        SELECT SUBSTR(timestamp, 1, 10) as day,
               COUNT(*) as total,
               SUM(CASE WHEN resolution_status = 'ANSWERED' THEN 1 ELSE 0 END) as answered,
               SUM(CASE WHEN resolution_status = 'UNANSWERED' THEN 1 ELSE 0 END) as unanswered,
               SUM(CASE WHEN knowledge_gap = 1 THEN 1 ELSE 0 END) as knowledge_gaps
        FROM query_analytics
        {where_extra}
        GROUP BY day
        ORDER BY day DESC
        LIMIT ?
    """, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]


class AnalyticsDatabase:
    """Wrapper class providing object-oriented access to analytics DB functions."""
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.SQLITE_DB_PATH
        self._init_table()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_table(self):
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS query_analytics (
                    query_id TEXT PRIMARY KEY,
                    conversation_id TEXT,
                    timestamp TEXT NOT NULL,
                    query_text TEXT NOT NULL,
                    query_type TEXT NOT NULL,
                    domain TEXT,
                    theme TEXT,
                    resolution_status TEXT NOT NULL,
                    clarification_required INTEGER NOT NULL DEFAULT 0,
                    clarification_count INTEGER NOT NULL DEFAULT 0,
                    retrieved_documents TEXT,
                    retrieved_chunks INTEGER NOT NULL DEFAULT 0,
                    retrieval_scores TEXT,
                    confidence TEXT NOT NULL,
                    response_latency REAL NOT NULL DEFAULT 0.0,
                    input_mode TEXT NOT NULL DEFAULT 'text',
                    generated_response TEXT,
                    knowledge_gap INTEGER NOT NULL DEFAULT 0,
                    failure_reason TEXT
                )
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error initializing custom analytics db: {e}")


    def log_query(self, entry: Dict[str, Any]) -> bool:
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            docs_json = json.dumps(entry.get("retrieved_documents") or [])
            scores_json = json.dumps(entry.get("retrieval_scores") or [])
            cursor.execute("""
                INSERT OR REPLACE INTO query_analytics (
                    query_id, conversation_id, timestamp, query_text, query_type,
                    domain, theme, resolution_status, clarification_required, clarification_count,
                    retrieved_documents, retrieved_chunks, retrieval_scores, confidence,
                    response_latency, input_mode, generated_response, knowledge_gap, failure_reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                entry.get("query_id") or str(uuid.uuid4()),
                entry.get("conversation_id"),
                entry.get("timestamp") or current_iso_timestamp(),
                entry.get("query_text") or "",
                entry.get("query_type") or "factual",
                entry.get("domain") or "General",
                entry.get("theme") or _derive_theme(entry.get("query_text", ""), entry.get("domain")),
                entry.get("resolution_status") or "ANSWERED",
                1 if entry.get("clarification_required") else 0,
                entry.get("clarification_count", 0),
                docs_json,
                len(entry.get("retrieved_chunks") or []) if isinstance(entry.get("retrieved_chunks"), list) else entry.get("retrieved_chunks", 0),
                scores_json,
                str(entry.get("confidence", "Medium")),
                round(float(entry.get("response_latency", 0.0)), 3),
                entry.get("input_mode", "text"),
                entry.get("response_text") or entry.get("generated_response") or "",
                1 if entry.get("knowledge_gap") else 0,
                entry.get("failure_reason")
            ))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"AnalyticsDatabase.log_query error: {e}")
            return False

    def get_queries(self, **kwargs) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        conditions = []
        params = []
        if kwargs.get("domain"):
            conditions.append("domain = ?")
            params.append(kwargs["domain"])
        if kwargs.get("query_type"):
            conditions.append("query_type = ?")
            params.append(kwargs["query_type"])
        if kwargs.get("status"):
            conditions.append("resolution_status = ?")
            params.append(kwargs["status"])
        if kwargs.get("conversation_id"):
            conditions.append("conversation_id = ?")
            params.append(kwargs["conversation_id"])
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        cursor.execute(f"SELECT * FROM query_analytics {where} ORDER BY timestamp DESC LIMIT ?", params + [kwargs.get("limit", 50)])
        rows = cursor.fetchall()
        conn.close()
        results = []
        for r in rows:
            item = dict(r)
            item["knowledge_gap"] = bool(item.get("knowledge_gap"))
            item["clarification_required"] = bool(item.get("clarification_required"))
            item["response_text"] = item.get("generated_response")
            for f in ["retrieved_documents", "retrieval_scores"]:
                if isinstance(item.get(f), str):
                    try:
                        item[f] = json.loads(item[f])
                    except Exception:
                        item[f] = []
            # min_confidence filter if requested
            if "min_confidence" in kwargs:
                try:
                    conf_val = float(item["confidence"])
                    if conf_val < kwargs["min_confidence"]:
                        continue
                except (ValueError, TypeError):
                    pass
            results.append(item)
        return results


    def get_summary(self, domain: Optional[str] = None) -> Dict[str, Any]:
        if self.db_path != settings.SQLITE_DB_PATH:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as total FROM query_analytics")
            total = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) as answered FROM query_analytics WHERE resolution_status = 'ANSWERED'")
            answered = cursor.fetchone()["answered"]
            cursor.execute("SELECT COUNT(*) as unanswered FROM query_analytics WHERE resolution_status = 'UNANSWERED'")
            unanswered = cursor.fetchone()["unanswered"]
            cursor.execute("SELECT COUNT(*) as low_conf FROM query_analytics WHERE resolution_status = 'LOW_CONFIDENCE'")
            low_conf = cursor.fetchone()["low_conf"]
            cursor.execute("SELECT COUNT(*) as gaps FROM query_analytics WHERE knowledge_gap = 1")
            gaps = cursor.fetchone()["gaps"]
            cursor.execute("SELECT AVG(CAST(confidence as REAL)) as avg_c, AVG(response_latency) as avg_l FROM query_analytics")
            r = cursor.fetchone()
            conn.close()
            return {
                "total_queries": total,
                "answered": answered,
                "unanswered": unanswered,
                "low_confidence": low_conf,
                "knowledge_gaps": gaps,
                "clarification_count": 0,
                "average_confidence": round(r["avg_c"] or 0.0, 2),
                "average_response_time": round(r["avg_l"] or 0.0, 2)
            }
        return get_analytics_summary(domain=domain)

    def get_knowledge_gaps(self, limit: int = 50, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.db_path != settings.SQLITE_DB_PATH:
            return [q for q in self.get_queries(limit=limit, domain=domain) if q.get("knowledge_gap")]
        return get_knowledge_gaps(limit=limit, domain=domain)

    def get_confidence_distribution(self, domain: Optional[str] = None) -> Dict[str, int]:
        if self.db_path != settings.SQLITE_DB_PATH:
            queries = self.get_queries(domain=domain)
            res = {"high": 0, "medium": 0, "low": 0}
            for q in queries:
                try:
                    c = float(q.get("confidence", 0))
                    if c >= 0.70:
                        res["high"] += 1
                    elif c >= 0.50:
                        res["medium"] += 1
                    else:
                        res["low"] += 1
                except Exception:
                    s = str(q.get("confidence", "")).lower()
                    if "high" in s:
                        res["high"] += 1
                    elif "med" in s:
                        res["medium"] += 1
                    else:
                        res["low"] += 1
            return res
        return get_confidence_distribution(domain=domain)

