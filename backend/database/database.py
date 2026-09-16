import sqlite3
from typing import List, Dict, Any, Optional
from backend.config import settings
from backend.utils import current_iso_timestamp

def get_connection():
    conn = sqlite3.connect(settings.SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize SQLite tables for document tracking."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            document_id TEXT PRIMARY KEY,
            document_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            chunks INTEGER NOT NULL DEFAULT 0,
            file_path TEXT,
            upload_time TEXT NOT NULL,
            status TEXT DEFAULT 'indexed'
        )
    """)
    conn.commit()
    conn.close()

# Auto-initialize database tables immediately
init_db()

def add_document(document_id: str, document_name: str, file_type: str, chunks: int, file_path: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    upload_time = current_iso_timestamp()
    cursor.execute("""
        INSERT OR REPLACE INTO documents (document_id, document_name, file_type, chunks, file_path, upload_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (document_id, document_name, file_type, chunks, file_path, upload_time, 'indexed'))
    conn.commit()
    conn.close()
    return {
        "document_id": document_id,
        "document_name": document_name,
        "file_type": file_type,
        "chunks": chunks,
        "file_path": file_path,
        "upload_time": upload_time,
        "status": "indexed"
    }

def get_all_documents() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY upload_time DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_document_by_id(document_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_document_from_db(document_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE document_id = ?", (document_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

def get_db_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), COALESCE(SUM(chunks), 0) FROM documents")
    total_docs, total_chunks = cursor.fetchone()
    conn.close()
    return {
        "total_documents": total_docs,
        "total_chunks": total_chunks
    }
