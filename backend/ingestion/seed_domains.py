import os
import shutil
import logging
from backend.config import BASE_DIR, settings
from backend.utils import generate_id, current_iso_timestamp
from backend.ingestion.document_loader import load_and_extract_document
from backend.chunking.text_chunker import chunk_document
from backend.embeddings.embedding_service import get_embedding_service
from backend.vectorstore.chroma_service import get_chroma_service
from backend.database.database import add_document, get_all_documents

logger = logging.getLogger(__name__)

DOMAIN_DOCS = [
    "College_Library_Policy.txt",
    "Hostel_Accommodation_Policy.txt",
    "Academic_Examination_Policy.txt"
]

def seed_domain_documents(force: bool = False):
    """
    Indexes the 3 primary domain documents into ChromaDB and SQLite if not already indexed.
    """
    sample_dir = os.path.join(BASE_DIR, "data", "sample_documents")
    existing_docs = {d["document_name"] for d in get_all_documents()}
    
    indexed = []
    embedding_service = get_embedding_service()
    chroma_service = get_chroma_service()

    for doc_name in DOMAIN_DOCS:
        if not force and doc_name in existing_docs:
            logger.info(f"Domain document '{doc_name}' is already indexed.")
            continue

        doc_path = os.path.join(sample_dir, doc_name)
        if not os.path.exists(doc_path):
            logger.warning(f"Domain sample document '{doc_path}' not found on disk.")
            continue

        document_id = generate_id("doc")
        dest_filename = f"{document_id}_{doc_name}"
        dest_path = os.path.join(settings.UPLOAD_DIR, dest_filename)
        shutil.copyfile(doc_path, dest_path)

        raw_items = load_and_extract_document(dest_path, doc_name)
        if not raw_items:
            continue

        upload_time = current_iso_timestamp()
        chunks = chunk_document(
            document_items=raw_items,
            document_name=doc_name,
            document_id=document_id,
            file_type="txt",
            upload_time=upload_time
        )
        if not chunks:
            continue

        chunk_texts = [c["content"] for c in chunks]
        embeddings = embedding_service.generate_embeddings(chunk_texts)
        chroma_service.add_chunks(chunks, embeddings)

        add_document(
            document_id=document_id,
            document_name=doc_name,
            file_type="txt",
            chunks=len(chunks),
            file_path=dest_path
        )
        indexed.append({"document_name": doc_name, "chunks": len(chunks), "document_id": document_id})
        logger.info(f"Indexed domain document '{doc_name}' ({len(chunks)} chunks).")

        # Explicitly release references and free memory
        del chunk_texts
        del embeddings
        del chunks
        del raw_items
        import gc
        gc.collect()

    return indexed

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    res = seed_domain_documents()
    print("Domain documents seeded:", res)
