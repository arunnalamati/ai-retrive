import re

def clean_text(text: str) -> str:
    """
    Clean raw extracted document text:
    - Normalizes unicode whitespace
    - Replaces consecutive whitespace/newlines
    - Removes non-printable control characters (except common newlines/tabs)
    - Strips leading and trailing whitespace
    """
    if not text:
        return ""
    
    # Remove NULL bytes and non-printable control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', text)
    
    # Replace carriage returns with standard newlines
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Collapse multiple consecutive newlines (more than 2) into 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Collapse horizontal spaces/tabs
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Strip each line and reassemble
    lines = [line.strip() for line in text.split('\n')]
    cleaned = '\n'.join(lines).strip()
    
    # Final collapse of redundant blank lines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    
    return cleaned
