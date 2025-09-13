from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkflowUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Optional[Dict[str, Any]]
    status: Optional[str] = None


class Node(BaseModel):
    pass


class Edge(BaseModel):
    pass


class Flow(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


class DocumentUrl(BaseModel):
    pass


class Definition(BaseModel):
    documentUrl: Optional[DocumentUrl] = None
    embeddingModel: Optional[str] = None
    llmModel: Optional[str] = None
    prompt: Optional[str] = None
    temperature: Optional[float] = None
    query: Optional[str] = None
    flow: Optional[Flow] = None


class WorkflowOut(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    definition: Optional[Definition] = None
    status: str
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
