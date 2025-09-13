from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None


class NodeMeasured(BaseModel):
    width: Optional[float] = None
    height: Optional[float] = None


class NodePosition(BaseModel):
    x: float
    y: float


class NodeData(BaseModel):
    nodeName: Optional[str] = None
    nodeDescription: Optional[str] = None


class Node(BaseModel):
    id: str
    type: Optional[str] = None
    position: Optional[NodePosition] = None
    data: Optional[NodeData] = None
    measured: Optional[NodeMeasured] = None


class Edge(BaseModel):
    id: str
    source: str
    target: str


class Flow(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


class DocumentUrl(BaseModel):
    url: Optional[str] = None


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


class WorkflowUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Optional[Definition] = None
    status: Optional[str] = None
