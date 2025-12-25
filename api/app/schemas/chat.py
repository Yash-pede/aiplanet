from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class ChatSessionCreate(BaseModel):
    workflow_id: UUID
    name: str

class ChatMessageCreateMetadata(BaseModel):
    workflow_id: UUID
    is_first: Optional[bool] = None
    search: bool

class ChatMessageCreate(BaseModel):
    message: str
    metadata: Optional[ChatMessageCreateMetadata] = None


class ChatMessageOut(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    message: Optional[str]
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SourcesDict(BaseModel):
    rag: Optional[str]
    web: Optional[Any]


class QueryRagOut(BaseModel):
    answer: str
    used_web: bool
    sources: SourcesDict
