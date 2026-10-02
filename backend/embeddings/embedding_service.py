import logging
from typing import List, Union
from backend.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Reusable embedding service wrapping SentenceTransformer("all-MiniLM-L6-v2").
    Implements singleton loading so the model weights are loaded only once into memory.
    """
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._initialize_model()
        return cls._instance

    def _initialize_model(self):
        import gc
        import torch
        from sentence_transformers import SentenceTransformer

        # Limit PyTorch to 1 CPU thread to minimize memory buffers on low-memory servers
        try:
            torch.set_num_threads(1)
            if hasattr(torch, "set_num_interop_threads"):
                torch.set_num_interop_threads(1)
        except Exception as e:
            logger.debug(f"PyTorch thread config: {e}")

        model_name = settings.EMBEDDING_MODEL
        logger.info(f"Loading SentenceTransformer model '{model_name}' on CPU...")
        self._model = SentenceTransformer(model_name, device="cpu")
        self._model.eval()
        gc.collect()
        logger.info(f"Model '{model_name}' loaded successfully. Vector dimension: {self.get_dimension()}")

    def get_dimension(self) -> int:
        """Return the embedding vector dimension (384 for all-MiniLM-L6-v2)."""
        if hasattr(self._model, "get_embedding_dimension"):
            return self._model.get_embedding_dimension()
        return self._model.get_sentence_embedding_dimension()

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate normalized vector embeddings for a list of texts."""
        if not texts:
            return []
        cleaned_texts = [str(t).strip() for t in texts if t is not None and str(t).strip()]
        if not cleaned_texts:
            return []

        import gc
        import torch
        with torch.inference_mode():
            embeddings = self._model.encode(
                cleaned_texts,
                batch_size=8,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
        result = embeddings.tolist()
        del embeddings
        gc.collect()
        return result

    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate a normalized vector embedding for a single search query."""
        if query is None or not isinstance(query, str) or not query.strip():
            raise ValueError("Query passed to generate_query_embedding must be a valid non-empty string.")

        import torch
        with torch.inference_mode():
            embedding = self._model.encode(
                query.strip(),
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
        return embedding.tolist()

_embedding_service_instance = None

def get_embedding_service() -> EmbeddingService:
    """Convenience getter for the EmbeddingService singleton."""
    global _embedding_service_instance
    if _embedding_service_instance is None:
        _embedding_service_instance = EmbeddingService()
    return _embedding_service_instance
