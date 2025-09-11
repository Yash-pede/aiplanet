from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Dict[str, Any]


class WorkflowOut(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    definition: Dict[str, Any]

    class Config:
        from_attributes = True
