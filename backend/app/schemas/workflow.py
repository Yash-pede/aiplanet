from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkflowUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Optional[Dict[str, Any]]


class WorkflowOut(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str] = None
    definition: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True
