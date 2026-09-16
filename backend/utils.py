import uuid
from datetime import datetime

def generate_id(prefix: str = "") -> str:
    """Generate a unique short identifier."""
    unique = uuid.uuid4().hex[:12]
    return f"{prefix}_{unique}" if prefix else unique

def current_iso_timestamp() -> str:
    """Return the current UTC/local timestamp in ISO format."""
    return datetime.now().isoformat()
