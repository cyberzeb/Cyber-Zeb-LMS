"""
Standard pagination for all list endpoints (Section 15.3 - API Standards).
Every module's `GET /resource` list endpoint should accept PaginationParams
and return a Page[T].
"""
from typing import Generic, List, TypeVar

from fastapi import Query
from pydantic import BaseModel

T = TypeVar("T")


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
        sort_by: str | None = Query(None),
        sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    ):
        self.page = page
        self.page_size = page_size
        self.sort_by = sort_by
        self.sort_dir = sort_dir

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int

    class Config:
        arbitrary_types_allowed = True
