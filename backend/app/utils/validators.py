import re
from typing import Any
from uuid import UUID


def is_valid_uuid(value: Any) -> bool:
    """Check if a value is a valid UUID."""
    try:
        UUID(str(value))
        return True
    except (ValueError, TypeError):
        return False


def is_valid_email(email: str) -> bool:
    """Check if an email address is valid."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def sanitize_filename(filename: str) -> str:
    """Sanitize a filename by removing/replacing invalid characters."""
    # Remove or replace invalid characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing whitespace and dots
    sanitized = sanitized.strip('. ')
    return sanitized or 'unnamed_file'
