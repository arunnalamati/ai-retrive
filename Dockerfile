# ==============================================================================
# Multi-Agent RAG System - Backend Dockerfile
# Optimized for Render, Railway, Fly.io, or VPS deployment
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
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

# Install Python dependencies (using PyTorch CPU wheels to minimize image size)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download and cache the sentence-transformers model during build
# This eliminates cold-start delays and timeout issues on cloud deploy
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

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
