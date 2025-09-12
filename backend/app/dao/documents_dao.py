from supabase import Client
from typing import List, Dict, Any
from uuid import UUID


class DocumentsDAO:
    def __init__(self, client: Client):
        self.client = client

    def create_document(self, workflow_id: UUID, file_name: str, file_url: str) -> Dict[str, Any]:
        data = {
            "workflow_id": str(workflow_id),
            "file_name": file_name,
            "file_url": file_url,
            "status": "pending"
        }
        response = self.client.table("documents").insert(data).execute()
        return response.data[0]

    def list_documents_by_workflow(self, workflow_id: UUID) -> List[Dict[str, Any]]:
        response = self.client.table("documents").select("*").eq("workflow_id", str(workflow_id)).execute()
        return response.data

    def get_document(self, document_id: UUID) -> Dict[str, Any]:
        response = self.client.table("documents").select("*").eq("id", str(document_id)).single().execute()
        return response.data

    def update_document_status(self, document_id: UUID, status: str) -> Dict[str, Any]:
        data = {"status": status}
        response = self.client.table("documents").update(data).eq("id", str(document_id)).execute()
        return response.data[0]