import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.database import init_db
from backend.api.upload import router as upload_router
from backend.api.documents import router as documents_router
from backend.api.query import router as query_router

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
    logger.info("Database initialized successfully.")
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
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
