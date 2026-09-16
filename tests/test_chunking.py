import pytest
from backend.ingestion.cleaner import clean_text
from backend.chunking.text_chunker import chunk_text, chunk_document

def test_clean_text():
    dirty = "This is  a   test.\n\n\n\nToo   many newlines and spaces.\x00\x07"
    cleaned = clean_text(dirty)
    assert "\x00" not in cleaned
    assert "\x07" not in cleaned
    assert "  " not in cleaned
    assert "\n\n\n" not in cleaned
    assert "This is a test." in cleaned

def test_chunk_text_basic():
    text = "Sentence one. Sentence two. Sentence three. Sentence four. Sentence five."
    chunks = chunk_text(text, chunk_size=30, chunk_overlap=10)
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 40  # within boundary tolerance
        assert len(chunk.strip()) > 0

def test_chunk_text_no_empty_chunks():
    text = "   \n\n   \t  \n  "
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
    assert len(chunks) == 0

def test_chunk_document_metadata():
    items = [
        {"text": "Page 1 content about machine learning and deep learning algorithms.", "page_number": 1, "section": "Intro"},
        {"text": "Page 2 content describing vector spaces and ChromaDB embeddings.", "page_number": 2, "section": "Methods"}
    ]
    chunks = chunk_document(
        document_items=items,
        document_name="test_doc.pdf",
        document_id="doc_test_123",
        file_type="pdf",
        upload_time="2026-09-16T00:00:00",
        chunk_size=100,
        chunk_overlap=20
    )
    assert len(chunks) >= 2
    assert chunks[0]["document_id"] == "doc_test_123"
    assert chunks[0]["document_name"] == "test_doc.pdf"
    assert chunks[0]["chunk_id"] == "chunk_001"
    assert chunks[0]["file_type"] == "pdf"
    assert chunks[0]["page_number"] == 1
    assert chunks[0]["section"] == "Intro"
    assert len(chunks[0]["content"]) > 0
