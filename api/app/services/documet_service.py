import os.path
from typing import List, Optional
from uuid import UUID

from langchain_text_splitters.character import RecursiveCharacterTextSplitter
from supabase import Client

from app.dao.documents_dao import DocumentsDAO
from app.schemas.document import DocumentCreate, DocumentOut
from app.core.config import settings
import requests

from langchain_community.document_loaders import PyPDFLoader
import pprint

from app.services.llm_service import add_to_chroma_db


class DocumentService:
    def __init__(self, client: Client):
        self.client = client
        self.document_dao = DocumentsDAO(client)

    def create_document(self, payload: DocumentCreate) -> DocumentOut:
        document = self.document_dao.create_document(
            workflow_id=payload.workflow_id,
            file_name=payload.file_name,
            file_url=payload.file_url,
        )
        return DocumentOut(**document)

    def list_documents_by_workflow(self, workflow_id: UUID) -> List[DocumentOut]:
        documents = self.document_dao.list_documents_by_workflow(workflow_id)
        return [DocumentOut(**doc) for doc in documents]

    def get_document(self, document_id: UUID) -> DocumentOut:
        document = self.document_dao.get_document(document_id)
        return DocumentOut(**document)

    def update_document_status(self, document_id: UUID, status: str) -> DocumentOut:
        document = self.document_dao.update_document_status(document_id, status)
        return DocumentOut(**document)

    def get_documents_by_workflow(self, workflow_id: UUID) -> DocumentOut:
        documents = self.document_dao.list_documents_by_workflow(workflow_id)
        return DocumentOut(**documents[0])

    def download_document(self, document_id: UUID) -> str:
        document = self.get_document(document_id)
        if not document:
            raise ValueError(
                f"Document with id {document_id} was not found."
            )
        if not os.path.exists(settings.TEMP_DIR):
            os.makedirs(settings.TEMP_DIR)

        print("Downloading document")

        local_path = os.path.join(settings.TEMP_DIR, f"{document.file_name}")

        response = requests.get(document.file_url)
        if response.status_code != 200:
            raise ValueError("Failed to download document")

        with open(local_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print("Successfully downloaded document")
        return local_path

    def process_and_store_document(self, document_id: UUID, workflow_id: UUID,
                                   embedding_model: Optional[str], ):

        file_path = self.download_document(document_id)

        loader = PyPDFLoader(file_path)
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        all_splits = text_splitter.split_documents(docs)

        print(docs[0].metadata)

        add_to_chroma_db(workflow_id, chunks=all_splits, embeddings_model=embedding_model)
        self.update_document_status(document_id, "processed")
        print("Document was successfully processed")
        os.remove(file_path)
        return {"document_id": document_id, "chunks_added": len(all_splits)}