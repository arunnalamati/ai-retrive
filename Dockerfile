# ==============================================================================
# Multi-Agent RAG System - Backend Dockerfile
# Optimized for Render, Railway, Fly.io, or VPS deployment
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files, tune glibc malloc arenas, and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    MALLOC_ARENA_MAX=2 \
    TORCH_CPU_ONLY=1 \
    OPENBLAS_NUM_THREADS=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    VECLIB_MAXIMUM_THREADS=1

WORKDIR /app

# Install system build dependencies required by ChromaDB / hnswlib
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specifications first for caching
COPY requirements.txt .

# Install Python dependencies: explicitly install PyTorch CPU-only wheel first
# to avoid pulling multi-gigabyte CUDA wheels that blow past the 512MB RAM limit
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download and cache the sentence-transformers model during build on CPU
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2', device='cpu')"

# Copy application source code and seed data
COPY backend/ ./backend/
COPY data/ ./data/

# Create required directories for persistence
RUN mkdir -p /app/data/chroma /app/data/uploads

# Expose target port
EXPOSE 8000

# Health check using FastAPI /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-8000}/health || exit 1

# Start the FastAPI application with dynamic PORT binding
CMD ["sh", "-c", "python -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
