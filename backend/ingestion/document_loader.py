import os
from typing import List, Dict, Any
from backend.ingestion.pdf_loader import load_pdf
from backend.ingestion.docx_loader import load_docx
from backend.ingestion.txt_loader import load_txt
from backend.ingestion.csv_loader import load_csv
from backend.ingestion.cleaner import clean_text

def load_and_extract_document(file_path: str, filename: str) -> List[Dict[str, Any]]:
    """
    Detect document type, extract raw sections/pages, and apply text cleaning.
    Supported extensions: .pdf, .docx, .txt, .csv
    """
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == ".pdf":
        raw_items = load_pdf(file_path)
    elif ext == ".docx":
        raw_items = load_docx(file_path)
    elif ext == ".txt":
        raw_items = load_txt(file_path)
    elif ext == ".csv":
        raw_items = load_csv(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}. Supported types: PDF, DOCX, TXT, CSV.")
        
    cleaned_items = []
    for item in raw_items:
        cleaned = clean_text(item["text"])
        if cleaned:
            cleaned_items.append({
                "text": cleaned,
                "page_number": item.get("page_number"),
                "section": item.get("section")
            })
            
    return cleaned_items
