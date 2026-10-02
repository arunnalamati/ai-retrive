import os
from pathlib import Path

# Prevent thread deadlock and restrict memory footprint for PyTorch / HuggingFace
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["MALLOC_ARENA_MAX"] = "2"
os.environ["TORCH_CPU_ONLY"] = "1"

from pydantic_settings import BaseSettings, SettingsConfigDict

# Root directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # LLM Settings (optional - safe extractive synthesis used when missing)
    LLM_PROVIDER: str = ""
    LLM_API_KEY: str = ""
    LLM_MODEL: str = ""

    # ChromaDB & Vector Store
    CHROMA_PATH: str = str(BASE_DIR / "data" / "chroma")
    COLLECTION_NAME: str = "knowledge_chunks"

    # Chunking
    CHUNK_SIZE: int = 700
    CHUNK_OVERLAP: int = 120

    # Retrieval and Ranking Thresholds (M4.3 Centralized Configuration)
    TOP_K: int = 3
    RETRIEVAL_THRESHOLD: float = 0.35
    SIMILARITY_THRESHOLD: float = 0.35
    CONFIDENCE_THRESHOLD_HIGH: float = 0.70
    CONFIDENCE_THRESHOLD_MEDIUM: float = 0.50

    # Analytics and Conversation Memory
    MAX_CONVERSATION_HISTORY: int = 10
    ANALYTICS_ENABLED: bool = True

    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # File and Data Storage
    UPLOAD_DIR: str = str(BASE_DIR / "data" / "uploads")
    SQLITE_DB_PATH: str = str(BASE_DIR / "data" / "metadata.db")

    # CORS Configuration
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure required data directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PATH, exist_ok=True)
os.makedirs(os.path.dirname(settings.SQLITE_DB_PATH), exist_ok=True)
