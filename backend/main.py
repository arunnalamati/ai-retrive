import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database.database import init_db
from backend.database.analytics_db import init_analytics_db
from backend.ingestion.seed_domains import seed_domain_documents
from backend.api.upload import router as upload_router
from backend.api.documents import router as documents_router
from backend.api.query import router as query_router
from backend.api.analytics import router as analytics_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("backend.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Initializing SQLite metadata database...")
    init_db()
    init_analytics_db()
    logger.info("Databases initialized successfully.")
    try:
        seed_domain_documents()
    except Exception as e:
        logger.warning(f"Domain documents auto-seeding deferred: {e}")
    yield
    # Shutdown tasks
    logger.info("Application shutting down...")

app = FastAPI(
    title="AI Knowledge Retrieval and Multi-Agent RAG System",
    description="Full-stack multi-agent RAG system implementing Milestones 1 and 2",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
configured_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
if "*" in configured_origins or not configured_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
    combined_origins = list(dict.fromkeys(configured_origins + dev_origins))
    app.add_middleware(
        CORSMiddleware,
        allow_origins=combined_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "AI Knowledge Retrieval and Multi-Agent RAG System",
        "status": "online",
        "documentation": "/docs",
        "health": "/health",
        "endpoints": {
            "health": "GET /health",
            "upload": "POST /upload",
            "documents": "GET /documents",
            "query": "POST /query",
            "stats": "GET /stats"
        }
    }

# Health endpoint
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "AI Knowledge Retrieval and Multi-Agent RAG System"
    }

# Register API routers
app.include_router(upload_router, tags=["Ingestion"])
app.include_router(documents_router, tags=["Documents"])
app.include_router(query_router, tags=["Retrieval & RAG"])
app.include_router(analytics_router, tags=["Analytics"])

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
