#!/bin/bash

# Create directory structure
mkdir -p app
mkdir -p app/core
mkdir -p app/clients
mkdir -p app/api
mkdir -p app/api/routes
mkdir -p app/services
mkdir -p app/dao
mkdir -p app/schemas
mkdir -p app/auth
mkdir -p app/utils

# Create all __init__.py files
touch app/__init__.py
touch app/core/__init__.py
touch app/clients/__init__.py
touch app/api/__init__.py
touch app/api/routes/__init__.py
touch app/services/__init__.py
touch app/dao/__init__.py
touch app/schemas/__init__.py
touch app/auth/__init__.py
touch app/utils/__init__.py

# Create app/core/config.py
cat << 'EOF' > app/core/config.py
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "FastAPI Backend"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000"])

    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str = None


settings = Settings()
EOF

# Create app/core/logging.py
cat << 'EOF' > app/core/logging.py
import logging
import sys


def setup_logging(level: str = "INFO") -> None:
    """Setup logging configuration for the application."""
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        stream=sys.stdout,
    )

    # Set uvicorn log levels
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn").setLevel(logging.INFO)
EOF

# Create app/clients/supabase_client.py
cat << 'EOF' > app/clients/supabase_client.py
from supabase import create_client, Client
from app.core.config import settings


def supabase_service_client() -> Client:
    """Create a service-level Supabase client."""
    key = settings.SUPABASE_SERVICE_KEY if settings.SUPABASE_SERVICE_KEY else settings.SUPABASE_ANON_KEY
    client = create_client(
        settings.SUPABASE_URL,
        key,
        options={
            "persist_session": False,
            "auto_refresh_token": False,
        }
    )
    return client


def supabase_user_client(access_token: str) -> Client:
    """Create a user-scoped Supabase client with the provided access token."""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY,
        options={
            "persist_session": False,
            "auto_refresh_token": False,
        }
    )
    
    # Set the session with the access token
    client.auth.set_session(access_token, "")
    client.postgrest.auth(access_token)
    
    return client
EOF

# Create app/api/deps.py
cat << 'EOF' > app/api/deps.py
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.clients.supabase_client import supabase_service_client, supabase_user_client

security = HTTPBearer()


def get_bearer_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract Bearer token from Authorization header."""
    if credentials.scheme != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme"
        )
    return credentials.credentials


def get_supabase_user(token: str = Depends(get_bearer_token)) -> Client:
    """Get user-scoped Supabase client."""
    try:
        client = supabase_user_client(token)
        return client
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


def get_supabase_service() -> Client:
    """Get service-scoped Supabase client."""
    return supabase_service_client()
EOF

# Create app/schemas/workflow.py
cat << 'EOF' > app/schemas/workflow.py
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
EOF

# Create app/schemas/document.py
cat << 'EOF' > app/schemas/document.py
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
EOF

# Create app/schemas/chat.py
cat << 'EOF' > app/schemas/chat.py
from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class ChatSessionCreate(BaseModel):
    workflow_id: UUID


class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    id: UUID
    session_id: UUID
    sender: str
    message: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
EOF

# Create app/schemas/common.py
cat << 'EOF' > app/schemas/common.py
from pydantic import BaseModel


class PageMeta(BaseModel):
    """Placeholder for pagination metadata."""
    total: int = 0
    page: int = 1
    per_page: int = 10
EOF

# Create app/dao/workflows_dao.py
cat << 'EOF' > app/dao/workflows_dao.py
from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID


class WorkflowsDAO:
    def __init__(self, client: Client):
        self.client = client

    def list_workflows(self) -> List[Dict[str, Any]]:
        """List all workflows for the authenticated user."""
        response = self.client.table("workflows").select("*").execute()
        return response.data

    def get_workflow(self, workflow_id: UUID) -> Optional[Dict[str, Any]]:
        """Get a specific workflow by ID."""
        response = self.client.table("workflows").select("*").eq("id", str(workflow_id)).single().execute()
        return response.data

    def create_workflow(self, name: str, description: Optional[str], definition: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new workflow."""
        data = {
            "name": name,
            "description": description,
            "definition": definition
        }
        response = self.client.table("workflows").insert(data).execute()
        return response.data[0]

    def update_workflow(self, workflow_id: UUID, name: Optional[str] = None, 
                       description: Optional[str] = None, definition: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Update an existing workflow."""
        data = {}
        if name is not None:
            data["name"] = name
        if description is not None:
            data["description"] = description
        if definition is not None:
            data["definition"] = definition
        
        response = self.client.table("workflows").update(data).eq("id", str(workflow_id)).execute()
        return response.data[0]

    def delete_workflow(self, workflow_id: UUID) -> bool:
        """Delete a workflow."""
        response = self.client.table("workflows").delete().eq("id", str(workflow_id)).execute()
        return len(response.data) > 0
EOF

# Create app/dao/documents_dao.py
cat << 'EOF' > app/dao/documents_dao.py
from supabase import Client
from typing import List, Dict, Any
from uuid import UUID


class DocumentsDAO:
    def __init__(self, client: Client):
        self.client = client

    def create_document(self, workflow_id: UUID, file_name: str, file_url: str) -> Dict[str, Any]:
        """Create a new document record."""
        data = {
            "workflow_id": str(workflow_id),
            "file_name": file_name,
            "file_url": file_url,
            "status": "pending"
        }
        response = self.client.table("documents").insert(data).execute()
        return response.data[0]

    def list_documents_by_workflow(self, workflow_id: UUID) -> List[Dict[str, Any]]:
        """List all documents for a specific workflow."""
        response = self.client.table("documents").select("*").eq("workflow_id", str(workflow_id)).execute()
        return response.data

    def get_document(self, document_id: UUID) -> Dict[str, Any]:
        """Get a specific document by ID."""
        response = self.client.table("documents").select("*").eq("id", str(document_id)).single().execute()
        return response.data

    def update_document_status(self, document_id: UUID, status: str) -> Dict[str, Any]:
        """Update document processing status."""
        data = {"status": status}
        response = self.client.table("documents").update(data).eq("id", str(document_id)).execute()
        return response.data[0]
EOF

# Create app/dao/chunks_dao.py
cat << 'EOF' > app/dao/chunks_dao.py
from supabase import Client
from typing import List, Dict, Any
from uuid import UUID


class ChunksDAO:
    def __init__(self, client: Client):
        self.client = client

    def bulk_insert_chunks(self, chunks: List[Dict[str, Any]]) -> bool:
        """Bulk insert document chunks."""
        if not chunks:
            return True
        
        response = self.client.table("document_chunks").insert(chunks).execute()
        return len(response.data) == len(chunks)

    def get_chunks_by_document(self, document_id: UUID) -> List[Dict[str, Any]]:
        """Get all chunks for a specific document."""
        response = self.client.table("document_chunks").select("*").eq("document_id", str(document_id)).order("chunk_index").execute()
        return response.data

    def get_chunks_by_workflow(self, workflow_id: UUID) -> List[Dict[str, Any]]:
        """Get all chunks for a specific workflow."""
        response = self.client.table("document_chunks").select("*").eq("workflow_id", str(workflow_id)).execute()
        return response.data
EOF

# Create app/dao/sessions_dao.py
cat << 'EOF' > app/dao/sessions_dao.py
from supabase import Client
from typing import List, Dict, Any
from uuid import UUID


class SessionsDAO:
    def __init__(self, client: Client):
        self.client = client

    def create_session(self, workflow_id: UUID) -> Dict[str, Any]:
        """Create a new chat session."""
        data = {"workflow_id": str(workflow_id)}
        response = self.client.table("chat_sessions").insert(data).execute()
        return response.data[0]

    def list_sessions_by_workflow(self, workflow_id: UUID) -> List[Dict[str, Any]]:
        """List all sessions for a specific workflow."""
        response = self.client.table("chat_sessions").select("*").eq("workflow_id", str(workflow_id)).order("created_at", desc=True).execute()
        return response.data

    def get_session(self, session_id: UUID) -> Dict[str, Any]:
        """Get a specific session by ID."""
        response = self.client.table("chat_sessions").select("*").eq("id", str(session_id)).single().execute()
        return response.data
EOF

# Create app/dao/messages_dao.py
cat << 'EOF' > app/dao/messages_dao.py
from supabase import Client
from typing import List, Dict, Any, Optional
from uuid import UUID


class MessagesDAO:
    def __init__(self, client: Client):
        self.client = client

    def list_messages_by_session(self, session_id: UUID) -> List[Dict[str, Any]]:
        """List all messages for a specific session."""
        response = self.client.table("chat_messages").select("*").eq("session_id", str(session_id)).order("created_at").execute()
        return response.data

    def insert_message(self, session_id: UUID, sender: str, message: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Insert a new message into a session."""
        data = {
            "session_id": str(session_id),
            "sender": sender,
            "message": message,
            "metadata": metadata
        }
        response = self.client.table("chat_messages").insert(data).execute()
        return response.data[0]
EOF

# Create app/services/workflows_service.py
cat << 'EOF' > app/services/workflows_service.py
from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from app.dao.workflows_dao import WorkflowsDAO
from app.schemas.workflow import WorkflowCreate, WorkflowOut


class WorkflowsService:
    def __init__(self, client: Client):
        self.dao = WorkflowsDAO(client)

    def list_workflows(self) -> List[WorkflowOut]:
        """List all workflows for the authenticated user."""
        workflows = self.dao.list_workflows()
        return [WorkflowOut(**workflow) for workflow in workflows]

    def get_workflow(self, workflow_id: UUID) -> Optional[WorkflowOut]:
        """Get a specific workflow by ID."""
        workflow = self.dao.get_workflow(workflow_id)
        return WorkflowOut(**workflow) if workflow else None

    def create_workflow(self, payload: WorkflowCreate) -> WorkflowOut:
        """Create a new workflow with validation."""
        # Validate definition is a proper dict
        if not isinstance(payload.definition, dict):
            raise ValueError("Workflow definition must be a dictionary")
        
        workflow = self.dao.create_workflow(
            name=payload.name,
            description=payload.description,
            definition=payload.definition
        )
        return WorkflowOut(**workflow)

    def update_workflow(self, workflow_id: UUID, payload: WorkflowCreate) -> WorkflowOut:
        """Update an existing workflow."""
        if not isinstance(payload.definition, dict):
            raise ValueError("Workflow definition must be a dictionary")
        
        workflow = self.dao.update_workflow(
            workflow_id=workflow_id,
            name=payload.name,
            description=payload.description,
            definition=payload.definition
        )
        return WorkflowOut(**workflow)

    def delete_workflow(self, workflow_id: UUID) -> bool:
        """Delete a workflow."""
        return self.dao.delete_workflow(workflow_id)
EOF

# Create app/services/documents_service.py
cat << 'EOF' > app/services/documents_service.py
from supabase import Client
from typing import List
from uuid import UUID
from app.dao.documents_dao import DocumentsDAO
from app.schemas.document import DocumentCreate, DocumentOut


class DocumentsService:
    def __init__(self, client: Client):
        self.dao = DocumentsDAO(client)

    def create_document(self, payload: DocumentCreate) -> DocumentOut:
        """Create a new document with status 'pending'."""
        document = self.dao.create_document(
            workflow_id=payload.workflow_id,
            file_name=payload.file_name,
            file_url=payload.file_url
        )
        return DocumentOut(**document)

    def list_documents_by_workflow(self, workflow_id: UUID) -> List[DocumentOut]:
        """List all documents for a specific workflow."""
        documents = self.dao.list_documents_by_workflow(workflow_id)
        return [DocumentOut(**doc) for doc in documents]

    def get_document(self, document_id: UUID) -> DocumentOut:
        """Get a specific document by ID."""
        document = self.dao.get_document(document_id)
        return DocumentOut(**document)

    def update_document_status(self, document_id: UUID, status: str) -> DocumentOut:
        """Update document processing status."""
        document = self.dao.update_document_status(document_id, status)
        return DocumentOut(**document)
EOF

# Create app/services/ingestion_service.py
cat << 'EOF' > app/services/ingestion_service.py
from supabase import Client
from typing import List, Dict, Any
from uuid import UUID


class IngestionService:
    def __init__(self, client: Client):
        self.client = client

    def extract_text_from_document(self, document_id: UUID, file_url: str) -> str:
        """Extract text from a document. Placeholder implementation."""
        # TODO: Implement actual text extraction logic
        return f"Extracted text from document {document_id}"

    def chunk_text(self, text: str, chunk_size: int = 1000) -> List[str]:
        """Chunk text into smaller segments. Placeholder implementation."""
        # TODO: Implement proper text chunking logic
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i:i + chunk_size])
        return chunks

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        """Generate embeddings for text chunks. Placeholder implementation."""
        # TODO: Implement actual embedding generation
        return [[0.0] * 384 for _ in chunks]  # Placeholder embeddings

    def process_document(self, document_id: UUID, workflow_id: UUID, file_url: str) -> bool:
        """Process a document through the full ingestion pipeline."""
        # TODO: Implement full processing pipeline
        # 1. Extract text
        # 2. Chunk text
        # 3. Generate embeddings
        # 4. Store chunks and embeddings
        # 5. Update document status
        return True
EOF

# Create app/services/chat_service.py
cat << 'EOF' > app/services/chat_service.py
from supabase import Client
from typing import Dict, Any
from uuid import UUID
from app.dao.sessions_dao import SessionsDAO
from app.dao.messages_dao import MessagesDAO
from app.schemas.chat import ChatSessionCreate, ChatMessageCreate, ChatMessageOut


class ChatService:
    def __init__(self, client: Client):
        self.sessions_dao = SessionsDAO(client)
        self.messages_dao = MessagesDAO(client)

    def create_session(self, payload: ChatSessionCreate) -> Dict[str, Any]:
        """Create a new chat session."""
        session = self.sessions_dao.create_session(payload.workflow_id)
        return session

    def list_sessions_by_workflow(self, workflow_id: UUID) -> list:
        """List all sessions for a workflow."""
        return self.sessions_dao.list_sessions_by_workflow(workflow_id)

    def append_user_message(self, session_id: UUID, payload: ChatMessageCreate) -> ChatMessageOut:
        """Append a user message to the session."""
        message = self.messages_dao.insert_message(
            session_id=session_id,
            sender="user",
            message=payload.message
        )
        return ChatMessageOut(**message)

    def generate_assistant_response(self, session_id: UUID, user_message: str) -> str:
        """Generate assistant response. Placeholder implementation."""
        # TODO: Implement actual retrieval and LLM logic
        return f"Assistant response to: {user_message}"

    def append_assistant_message(self, session_id: UUID, message: str, metadata: Dict[str, Any] = None) -> ChatMessageOut:
        """Append an assistant message to the session."""
        message_data = self.messages_dao.insert_message(
            session_id=session_id,
            sender="llm",
            message=message,
            metadata=metadata
        )
        return ChatMessageOut(**message_data)

    def process_chat_message(self, session_id: UUID, payload: ChatMessageCreate) -> ChatMessageOut:
        """Process a complete chat interaction."""
        # 1. Store user message
        self.append_user_message(session_id, payload)
        
        # 2. Generate assistant response
        assistant_response = self.generate_assistant_response(session_id, payload.message)
        
        # 3. Store and return assistant message
        return self.append_assistant_message(session_id, assistant_response)

    def list_messages(self, session_id: UUID) -> list:
        """List all messages in a session."""
        messages = self.messages_dao.list_messages_by_session(session_id)
        return [ChatMessageOut(**msg) for msg in messages]
EOF

# Create app/auth/rls.py
cat << 'EOF' > app/auth/rls.py
"""
Row Level Security (RLS) utilities.

This module contains utilities for working with Supabase RLS policies.
The actual RLS policies should be defined in your Supabase database
and will automatically enforce access control based on auth.uid().
"""

from typing import Dict, Any


def get_user_context() -> Dict[str, Any]:
    """Get the current user context for RLS."""
    # This is handled automatically by Supabase when using user-scoped clients
    # RLS policies will use auth.uid() to filter results
    return {}
EOF

# Create app/auth/jwt.py
cat << 'EOF' > app/auth/jwt.py
"""
JWT utilities for Supabase authentication.

This module contains utilities for working with Supabase JWT tokens.
Token validation is handled by the Supabase client itself.
"""

from typing import Optional, Dict, Any


def decode_jwt_payload(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode JWT payload without verification.
    
    Note: This is for informational purposes only.
    Actual token validation is handled by Supabase client.
    """
    # TODO: Implement if needed for debugging/logging purposes
    return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from JWT token.
    
    Note: This is for informational purposes only.
    Actual user identification is handled by Supabase RLS.
    """
    # TODO: Implement if needed for debugging/logging purposes
    return None
EOF

# Create app/utils/pagination.py
cat << 'EOF' > app/utils/pagination.py
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
EOF

# Create app/utils/validators.py
cat << 'EOF' > app/utils/validators.py
import re
from typing import Any
from uuid import UUID


def is_valid_uuid(value: Any) -> bool:
    """Check if a value is a valid UUID."""
    try:
        UUID(str(value))
        return True
    except (ValueError, TypeError):
        return False


def is_valid_email(email: str) -> bool:
    """Check if an email address is valid."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def sanitize_filename(filename: str) -> str:
    """Sanitize a filename by removing/replacing invalid characters."""
    # Remove or replace invalid characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing whitespace and dots
    sanitized = sanitized.strip('. ')
    return sanitized or 'unnamed_file'
EOF

# Create app/api/routes/health.py
cat << 'EOF' > app/api/routes/health.py
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "API is running"}
EOF

# Create app/api/routes/workflows.py
cat << 'EOF' > app/api/routes/workflows.py
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List
from uuid import UUID

from app.api.deps import get_supabase_user
from app.services.workflows_service import WorkflowsService
from app.schemas.workflow import WorkflowCreate, WorkflowOut

router = APIRouter()


@router.get("/workflows", response_model=List[WorkflowOut])
async def list_workflows(client: Client = Depends(get_supabase_user)):
    """List all workflows for the authenticated user."""
    service = WorkflowsService(client)
    return service.list_workflows()


@router.post("/workflows", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    payload: WorkflowCreate,
    client: Client = Depends(get_supabase_user)
):
    """Create a new workflow."""
    service = WorkflowsService(client)
    try:
        return service.create_workflow(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/workflows/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(
    workflow_id: UUID,
    client: Client = Depends(get_supabase_user)
):
    """Get a specific workflow by ID."""
    service = WorkflowsService(client)
    workflow = service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return workflow


@router.put("/workflows/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(
    workflow_id: UUID,
    payload: WorkflowCreate,
    client: Client = Depends(get_supabase_user)
):
    """Update a workflow."""
    service = WorkflowsService(client)
    try:
        return service.update_workflow(workflow_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: UUID,
    client: Client = Depends(get_supabase_user)
):
    """Delete a workflow."""
    service = WorkflowsService(client)
    success = service.delete_workflow(workflow_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return {"message": "Workflow deleted successfully"}
EOF

# Create app/api/routes/documents.py
cat << 'EOF' > app/api/routes/documents.py
from fastapi import APIRouter, Depends, status
from supabase import Client
from typing import List
from uuid import UUID

from app.api.deps import get_supabase_user
from app.services.documents_service import DocumentsService
from app.schemas.document import DocumentCreate, DocumentOut

router = APIRouter()


@router.post("/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def create_document(
    payload: DocumentCreate,
    client: Client = Depends(get_supabase_user)
):
    """Create a new document metadata record with status 'pending'."""
    service = DocumentsService(client)
    return service.create_document(payload)


@router.get("/workflows/{workflow_id}/documents", response_model=List[DocumentOut])
async def list_documents_by_workflow(
    workflow_id: UUID,
    client: Client = Depends(get_supabase_user)
):
    """List all documents for a specific workflow."""
    service = DocumentsService(client)
    return service.list_documents_by_workflow(workflow_id)
EOF

# Create app/api/routes/sessions.py
cat << 'EOF' > app/api/routes/sessions.py
from fastapi import APIRouter, Depends, status
from supabase import Client
from typing import List
from uuid import UUID

from app.api.deps import get_supabase_user
from app.services.chat_service import ChatService
from app.schemas.chat import ChatSessionCreate

router = APIRouter()


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: ChatSessionCreate,
    client: Client = Depends(get_supabase_user)
):
    """Create a new chat session for a workflow."""
    service = ChatService(client)
    return service.create_session(payload)


@router.get("/workflows/{workflow_id}/sessions")
async def list_sessions_by_workflow(
    workflow_id: UUID,
    client: Client = Depends(get_supabase_user)
):
    """List all chat sessions for a specific workflow."""
    service = ChatService(client)
    return service.list_sessions_by_workflow(workflow_id)
EOF

# Create app/api/routes/messages.py
cat << 'EOF' > app/api/routes/messages.py
from fastapi import APIRouter, Depends
from supabase import Client
from uuid import UUID

from app.api.deps import get_supabase_user
from app.services.chat_service import ChatService
from app.schemas.chat import ChatMessageCreate, ChatMessageOut

router = APIRouter()


@router.get("/sessions/{session_id}/messages")
async def list_messages(
    session_id: UUID,
    client: Client = Depends(get_supabase_user)
):
    """List all messages in a chat session."""
    service = ChatService(client)
    return service.list_messages(session_id)


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageOut)
async def create_message(
    session_id: UUID,
    payload: ChatMessageCreate,
    client: Client = Depends(get_supabase_user)
):
    """Create a user message, process it, and return the assistant response."""
    service = ChatService(client)
    return service.process_chat_message(session_id, payload)
EOF

# Create app/main.py
cat << 'EOF' > app/main.py
import uuid
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import health, workflows, documents, sessions, messages

# Setup logging
setup_logging()

# Create FastAPI app
app = FastAPI(title=settings.APP_NAME)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id_and_handle_exceptions(request: Request, call_next):
    """Add request ID and handle unhandled exceptions."""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal server error",
                "request_id": request_id,
            },
            headers={"X-Request-ID": request_id}
        )


# Include routers
app.include_router(health.router, prefix=settings.API_PREFIX, tags=["health"])
app.include_router(workflows.router, prefix=settings.API_PREFIX, tags=["workflows"])
app.include_router(documents.router, prefix=settings.API_PREFIX, tags=["documents"])
app.include_router(sessions.router, prefix=settings.API_PREFIX, tags=["sessions"])
app.include_router(messages.router, prefix=settings.API_PREFIX, tags=["messages"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": f"Welcome to {settings.APP_NAME}", "status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
EOF

# Output environment setup instructions
echo ""
echo "=========================================="
echo "FastAPI Backend Project Created!"
echo "=========================================="
echo ""
echo "Required environment variables (.env):"
echo "SUPABASE_URL=your_supabase_project_url"
echo "SUPABASE_ANON_KEY=your_supabase_anon_key"
echo "SUPABASE_SERVICE_KEY=your_supabase_service_key  # optional"
echo ""
echo "Install dependencies:"
echo "pip install fastapi uvicorn pydantic-settings supabase"
echo ""
echo "Run the application:"
echo "fastapi dev"
echo "# or"
echo "uvicorn app.main:app --reload"
echo ""
echo "=========================================="