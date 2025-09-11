from typing import TypeVar, Generic, List
from pydantic import BaseModel

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model."""
    items: List[T]
    total: int
    page: int
    per_page: int
    total_pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, per_page: int) -> "PaginatedResponse[T]":
        """Create a paginated response."""
        total_pages = (total + per_page - 1) // per_page
        return cls(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )


def paginate_query(page: int = 1, per_page: int = 10) -> tuple[int, int]:
    """Calculate offset and limit for pagination."""
    page = max(1, page)
    per_page = min(max(1, per_page), 100)  # Limit max per_page to 100
    offset = (page - 1) * per_page
    return offset, per_page
