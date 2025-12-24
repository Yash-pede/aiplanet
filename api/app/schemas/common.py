from pydantic import BaseModel


class PageMeta(BaseModel):
    """Placeholder for pagination metadata."""
    total: int = 0
    page: int = 1
    per_page: int = 10
