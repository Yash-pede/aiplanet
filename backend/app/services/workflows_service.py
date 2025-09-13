from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from app.dao.workflows_dao import WorkflowsDAO
from app.schemas.workflow import WorkflowCreate, WorkflowOut, WorkflowUpdate
from app.services.documents_service import DocumentsService


class WorkflowsService:
    def __init__(self, client: Client):
        self.dao = WorkflowsDAO(client)
        self.documents_service = DocumentsService(client)

    def list_workflows(self) -> List[WorkflowOut]:
        workflows = self.dao.list_workflows()
        return [WorkflowOut(**workflow) for workflow in workflows]

    def get_workflow(self, workflow_id: UUID) -> Optional[WorkflowOut]:
        workflow = self.dao.get_workflow(workflow_id)
        return WorkflowOut(**workflow) if workflow else None

    def create_workflow(self, payload: WorkflowCreate) -> WorkflowOut:
        workflow = self.dao.create_workflow(
            name=payload.name,
            description=payload.description,
        )
        return WorkflowOut(**workflow)

    def update_workflow(
        self, workflow_id: UUID, payload: WorkflowUpdate
    ) -> WorkflowOut:
        # if payload.definition is None or not isinstance(payload.definition, dict) :
        #     raise ValueError("Workflow definition must be a dictionary")

        workflow = self.dao.update_workflow(
            workflow_id=workflow_id,
            name=payload.name,
            description=payload.description,
            definition=payload.definition,
        )
        return WorkflowOut(**workflow)

    def delete_workflow(self, workflow_id: UUID) -> bool:
        return self.dao.delete_workflow(workflow_id)

    async def execute_workflow(self, workflow_id: UUID):
        workflow = self.get_workflow(workflow_id)
        if not workflow or not workflow.definition:
            print(f"Workflow {workflow_id} not found or has no definition")
            return None
        if workflow.status == "in_progress" or workflow.status == "completed":
            print(f"Workflow {workflow_id} is already in {workflow.status} state")
            return None
        self.update_workflow(
            workflow_id, WorkflowUpdate(**workflow.dict(), status="in_progress")
        )
        print(f"Executing workflow {workflow_id}...")
        document = self.documents_service.get_documents_by_workflow(workflow_id)
        document_response = self.documents_service.process_and_store_document(
            document_id=document.id, embedding_model=workflow.definition.embeddingModel
        )
        print(f"Document processed and stored: {document_response}")

        self.update_workflow(
            workflow_id, WorkflowUpdate(**workflow.dict(), status="completed")
        )
