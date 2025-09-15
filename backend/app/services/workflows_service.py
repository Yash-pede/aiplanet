from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from app.dao.workflows_dao import WorkflowsDAO
from app.schemas.workflow import WorkflowCreate, WorkflowOut, WorkflowUpdate
from app.services.documents_service import DocumentsService
from app.services.chat_service import ChatService
from app.schemas.chat import ChatSessionCreate, ChatMessageCreate


class WorkflowsService:
    def __init__(self, client: Client):
        self.dao = WorkflowsDAO(client)
        self.documents_service = DocumentsService(client)
        self.chat_service = ChatService(client)

    def list_workflows(self) -> List[WorkflowOut]:
        workflows = self.dao.list_workflows()
        return [WorkflowOut(**workflow) for workflow in workflows]

    def get_workflow(self, workflow_id: UUID) -> Optional[WorkflowOut | Any]:
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
        workflow = self.dao.update_workflow(
            workflow_id=workflow_id,
            name=payload.name,
            description=payload.description,
            definition=payload.definition,
            status=payload.status,
        )
        return WorkflowOut(**workflow)

    def delete_workflow(self, workflow_id: UUID) -> bool:
        return self.dao.delete_workflow(workflow_id)

    async def execute_workflow(self, workflow_id: UUID):
        workflow = self.get_workflow(workflow_id)

        if not workflow or not workflow.definition:
            print(
                f"[WorkflowService] Workflow {workflow_id} not found or has no definition"
            )
            return None

        if workflow.status in ("in_progress", "completed"):
            print(
                f"[WorkflowService] Workflow {workflow_id} is already {workflow.status}"
            )
            return None

        self.update_workflow(
            workflow_id=workflow_id,
            payload=WorkflowUpdate(status="in_progress"),
        )
        print(f"[WorkflowService] Executing workflow {workflow_id}...")

        try:
            document = self.documents_service.get_documents_by_workflow(workflow_id)
            if not document:
                raise ValueError(f"No document found for workflow {workflow_id}")

            if document.status == "processed":
                print(f"[WorkflowService] Document {document.id} already processed.")
                self.update_workflow(
                    workflow_id=workflow_id,
                    payload=WorkflowUpdate(status="completed"),
                )
                return {
                    "message": "Document already processed",
                    "document_id": document.id,
                }

            if document.status != "pending":
                raise ValueError(
                    f"Document {document.id} is in invalid state: {document.status}"
                )

            document_response = self.documents_service.process_and_store_document(
                document_id=document.id,
                embedding_model=workflow.definition.embeddingModel,
            )
            print(
                f"[WorkflowService] Document processed and stored: {document_response}"
            )
            # Generate initial chat session and response
            new_session = self.chat_service.create_session(
                payload=ChatSessionCreate(
                    workflow_id=workflow_id, name=str(workflow.definition.query)
                )
            )
            print(f"[WorkflowService] Created new session: {new_session['id']}")

            assistant_response = await self.chat_service.process_chat_message(
                payload=ChatMessageCreate(message=str(workflow.definition.query)),
                session_id=new_session["id"],
            )
            print(f"\n\n\n\n\n\n\n[WorkflowService] Assistant response: {assistant_response}")

            # ✅ Mark workflow as completed
            self.update_workflow(
                workflow_id=workflow_id,
                payload=WorkflowUpdate(status="completed"),
            )
            return document_response

        except Exception as e:
            print(f"[WorkflowService] Error processing workflow {workflow_id}: {e}")
            # ✅ Mark workflow as failed
            self.update_workflow(
                workflow_id=workflow_id,
                payload=WorkflowUpdate(status="failed"),
            )
            return {"error": str(e)}
