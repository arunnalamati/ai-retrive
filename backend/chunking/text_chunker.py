from typing import List, Dict, Any, Optional
from backend.config import settings

def chunk_text(
    text: str,
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None
) -> List[str]:
    """
    Split a single continuous string into chunks using character-level sliding windows
    with boundary respect (paragraphs -> sentences -> whitespace -> hard cut).
    Discards empty chunks.
    """
    if not text or not text.strip():
        return []
        
    size = chunk_size or settings.CHUNK_SIZE
    overlap = chunk_overlap or settings.CHUNK_OVERLAP
    
    if overlap >= size:
        overlap = size // 4
        
    text = text.strip()
    if len(text) <= size:
        return [text]
        
    chunks: List[str] = []
    start = 0
    text_length = len(text)
    
    separators = ["\n\n", "\n", ". ", "? ", "! ", " ", ""]
    
    while start < text_length:
        end = min(start + size, text_length)
        chunk_slice = text[start:end]
        
        if end < text_length:
            split_pos = -1
            # Try to break at a natural boundary near the end
            for sep in separators:
                if sep == "":
                    split_pos = len(chunk_slice)
                    break
                pos = chunk_slice.rfind(sep)
                # Ensure the boundary isn't too early (at least 60% into the chunk)
                if pos != -1 and pos >= int(size * 0.6):
                    split_pos = pos + len(sep)
                    break
            if split_pos != -1:
                end = start + split_pos
                
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        if end >= text_length:
            break
            
        step = max(1, (end - start) - overlap)
        start += step
        
    return chunks

def chunk_document(
    document_items: List[Dict[str, Any]],
    document_name: str,
    document_id: str,
    file_type: str,
    upload_time: str,
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Convert extracted document items (pages/sections) into chunk objects with complete metadata.
    """
    all_chunks = []
    chunk_counter = 1
    
    for item in document_items:
        raw_text = item.get("text", "")
        page_number = item.get("page_number")
        section = item.get("section")
        
        text_slices = chunk_text(raw_text, chunk_size, chunk_overlap)
        
        for text_slice in text_slices:
            if not text_slice.strip():
                continue
                
            chunk_id = f"chunk_{chunk_counter:03d}"
            all_chunks.append({
                "id": f"{document_id}_{chunk_id}",
                "chunk_id": chunk_id,
                "document_id": document_id,
                "document_name": document_name,
                "file_type": file_type,
                "page_number": page_number,
                "section": section,
                "upload_time": upload_time,
                "content": text_slice
            })
            chunk_counter += 1
            
    return all_chunks
