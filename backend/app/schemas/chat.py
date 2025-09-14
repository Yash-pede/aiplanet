from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class ChatSessionCreate(BaseModel):
    workflow_id: UUID
    name: str

class chatMessageCreateMetadata(BaseModel):
    workflow_id: UUID
    is_first: Optional[bool] = None
class ChatMessageCreate(BaseModel):
    message: str
    metadata: Optional[chatMessageCreateMetadata]


class ChatMessageOut(BaseModel):
    id: UUID
    session_id: UUID
    sender: str
    message: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
