from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class DocumentCreate(BaseModel):
    workflow_id: UUID
    file_name: str
    file_url: str


class DocumentOut(BaseModel):
    id: UUID
    workflow_id: UUID
    user_id: Optional[UUID] = None
    file_name: str
    file_url: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
