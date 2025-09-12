from supabase import Client
from typing import List
from uuid import UUID
from app.dao.documents_dao import DocumentsDAO
from app.schemas.document import DocumentCreate, DocumentOut


class DocumentsService:
    def __init__(self, client: Client):
        self.dao = DocumentsDAO(client)

    def create_document(self, payload: DocumentCreate) -> DocumentOut:
        document = self.dao.create_document(
            workflow_id=payload.workflow_id,
            file_name=payload.file_name,
            file_url=payload.file_url
        )
        return DocumentOut(**document)

    def list_documents_by_workflow(self, workflow_id: UUID) -> List[DocumentOut]:
        documents = self.dao.list_documents_by_workflow(workflow_id)
        return [DocumentOut(**doc) for doc in documents]

    def get_document(self, document_id: UUID) -> DocumentOut:
        document = self.dao.get_document(document_id)
        return DocumentOut(**document)

    def update_document_status(self, document_id: UUID, status: str) -> DocumentOut:
        document = self.dao.update_document_status(document_id, status)
        return DocumentOut(**document)