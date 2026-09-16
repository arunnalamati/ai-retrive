from typing import List, Dict, Any

def load_txt(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract text from a plain TXT file using UTF-8 with fallback encodings.
    """
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    content = ""
    
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue
            
    if not content:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            
    return [{
        "text": content,
        "page_number": None,
        "section": "Main Document"
    }]
