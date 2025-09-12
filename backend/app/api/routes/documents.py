from fastapi import APIRouter, Depends, status
from supabase import Client
from typing import List
from uuid import UUID

from app.api.deps import get_supabase_user
from app.services.documents_service import DocumentsService
from app.schemas.document import DocumentCreate, DocumentOut

router = APIRouter()


@router.post(
    "/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED
)
async def create_document(
    payload: DocumentCreate, client: Client = Depends(get_supabase_user)
):
    service = DocumentsService(client)
    return service.create_document(payload)


@router.get("/workflows/{workflow_id}/documents", response_model=List[DocumentOut])
async def list_documents_by_workflow(
    workflow_id: UUID, client: Client = Depends(get_supabase_user)
):
    service = DocumentsService(client)
    return service.list_documents_by_workflow(workflow_id)


@router.get("/documents/{document_id}", response_model=DocumentOut)
async def get_document(document_id: UUID, client: Client = Depends(get_supabase_user)):
    service = DocumentsService(client)
    return service.get_document(document_id)
