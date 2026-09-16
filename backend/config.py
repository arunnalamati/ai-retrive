import os
from pathlib import Path
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

    # Retrieval Threshold
    RETRIEVAL_THRESHOLD: float = 0.35

    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # File and Data Storage
    UPLOAD_DIR: str = str(BASE_DIR / "data" / "uploads")
    SQLITE_DB_PATH: str = str(BASE_DIR / "data" / "metadata.db")

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
