from uuid import UUID

from fastapi import Depends, APIRouter
from supabase import Client

from app.routes.deps import supabase_dependency
from app.schemas.document import DocumentOut

from app.services.documet_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/{document_id}",response_model=DocumentOut)
async def get_document(document_id: UUID,client: Client = Depends(supabase_dependency)):
    service = DocumentService(client)
    document = service.get_document(document_id)
    return document

