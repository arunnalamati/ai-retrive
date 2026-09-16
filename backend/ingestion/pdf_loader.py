from typing import List, Dict, Any
from pypdf import PdfReader

def load_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract text from a PDF file using pypdf.
    Returns a list of dicts with 'text', 'page_number', 'section'.
    """
    reader = PdfReader(file_path)
    extracted_items = []
    
    for page_idx, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        if page_text.strip():
            extracted_items.append({
                "text": page_text,
                "page_number": page_idx + 1,
                "section": f"Page {page_idx + 1}"
            })
            
    return extracted_items
