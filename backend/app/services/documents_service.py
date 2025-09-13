from supabase import Client
from typing import List, Optional
from uuid import UUID
from app.dao.documents_dao import DocumentsDAO
from app.schemas.document import DocumentCreate, DocumentOut
import os
import requests
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.clients.chroma_client import get_chroma
from app.core.config import metadata

TEMP_DIR = "tmp_docs"


class DocumentsService:
    def __init__(self, client: Client):
        self.dao = DocumentsDAO(client)

    def create_document(self, payload: DocumentCreate) -> DocumentOut:
        document = self.dao.create_document(
            workflow_id=payload.workflow_id,
            file_name=payload.file_name,
            file_url=payload.file_url,
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

    def get_documents_by_workflow(self, workflow_id: UUID) -> DocumentOut:
        documents = self.dao.list_documents_by_workflow(workflow_id)
        return DocumentOut(**documents[0])

    def download_document(self, document_id: UUID) -> str:
        document = self.get_document(document_id)
        if not document:
            raise ValueError("Document not found")

        if not os.path.exists(TEMP_DIR):
            os.makedirs(TEMP_DIR)

        local_path = os.path.join(TEMP_DIR, f"{document.file_name}")

        response = requests.get(document.file_url)
        if response.status_code != 200:
            raise ValueError("Failed to download document")

        with open(local_path, "wb") as f:
            f.write(response.content)

        return local_path

    def process_and_store_document(
        self,
        document_id: UUID,
        embedding_model: Optional[str],
    ) -> dict:
        file_path = self.download_document(document_id)

        loader = PyPDFLoader(file_path)
        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=80)
        chunks = splitter.split_documents(documents)

        for i, chunk in enumerate(chunks):
            chunk.metadata["document_id"] = str(document_id)
            chunk.metadata["chunk_index"] = i

        if not embedding_model:
            embedding_model = metadata.embedding_models[0]
        db = get_chroma(embedding_model=embedding_model)
        ids = [f"{document_id}:{i}" for i in range(len(chunks))]
        db.add_documents(chunks, ids=ids)
        db.persist()
        self.update_document_status(document_id, "processed")

        os.remove(file_path)

        return {"document_id": document_id, "chunks_added": len(chunks)}
