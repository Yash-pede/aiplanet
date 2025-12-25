import traceback
from pprint import pprint
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.dao.documents_dao import DocumentsDAO
from app.dao.workflows_dao import WorkflowsDao
from app.schemas.chat import ChatSessionCreate, ChatMessageCreate
from app.schemas.document import DocumentOut
from app.schemas.workflow import WorkflowOut, WorkflowCreate, WorkflowUpdate
from app.services.chat_service import ChatService
from app.services.documet_service import DocumentService


class WorkflowService:
    def __init__(self, client: Client):
        self.dao = WorkflowsDao(client)
        self.document_service = DocumentService(client)
        self.chat_service = ChatService(client)

    def list_workflows(self):
        workflows = self.dao.list_workflows()
        return [WorkflowOut(**workflow) for workflow in workflows]

    def get_workflow(self, workflow_id: UUID):
        return self.dao.get_workflow(workflow_id)

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

    def validate_workflow(self, workflow_id: UUID) -> None:
        """
        Validates whether a workflow is executable.
        Raises HTTPException if invalid.
        """

        workflow = self.dao.get_workflow(workflow_id)

        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found",
            )

        definition = workflow.get("definition")
        if not definition:
            raise HTTPException(
                status_code=400,
                detail="Workflow definition is missing",
            )

        flow = definition.get("flow", {})
        nodes = flow.get("nodes", [])
        edges = flow.get("edges", [])

        if not nodes or not edges:
            raise HTTPException(
                status_code=400,
                detail="Workflow must contain nodes and edges",
            )

        # 2️⃣ Extract required nodes
        def get_node(node_type: str):
            return next((n for n in nodes if n.get("type") == node_type), None)

        input_node = get_node("query")
        kb_node = get_node("knowledge-base")
        llm_node = get_node("llm")
        output_node = get_node("output")

        if not all([input_node, kb_node, llm_node, output_node]):
            raise HTTPException(
                status_code=400,
                detail="Workflow must contain query, knowledge-base, llm, and output nodes",
            )

        # 3️⃣ Validate connections
        def has_edge(src: str, tgt: str) -> bool:
            return any(
                e.get("source") == src and e.get("target") == tgt
                for e in edges
            )

        if not has_edge(input_node["id"], kb_node["id"]):
            raise HTTPException(
                status_code=400,
                detail="Missing connection: query → knowledge-base",
            )

        if not has_edge(kb_node["id"], llm_node["id"]):
            raise HTTPException(
                status_code=400,
                detail="Missing connection: knowledge-base → llm",
            )

        if not has_edge(llm_node["id"], output_node["id"]):
            raise HTTPException(
                status_code=400,
                detail="Missing connection: llm → output",
            )

        # 4️⃣ Required fields validation
        if not definition.get("query"):
            raise HTTPException(
                status_code=400,
                detail="Workflow query is required",
            )

        if not definition.get("prompt"):
            raise HTTPException(
                status_code=400,
                detail="LLM prompt is required",
            )

        if not definition.get("embeddingModel"):
            raise HTTPException(
                status_code=400,
                detail="Embedding model must be selected",
            )

        if not definition.get("llmModel"):
            raise HTTPException(
                status_code=400,
                detail="LLM model must be selected",
            )

        # 5️⃣ Document existence check
        documents = self.document_service.list_documents_by_workflow(workflow_id)
        if not documents:
            raise HTTPException(
                status_code=400,
                detail="No document uploaded for this workflow",
            )

        # ✅ All validations passed
        return None

    async def execute_workflow(self, workflow_id: UUID):
        workflow_response = self.dao.get_workflow(workflow_id)
        workflow = WorkflowOut(**workflow_response)
        pprint(workflow)
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

        print(f"[WorkflowService] Executing workflow {workflow_id} ...")

        self.update_workflow(workflow_id, payload=WorkflowUpdate(status="in_progress"))

        print("[WorkflowService] Workflow {workflow_id} was updated")

        try:
            document: DocumentOut = self.document_service.list_documents_by_workflow(workflow_id)[0]
            if not document:
                raise Exception("No document uploaded for this workflow")

            if document.status == "processed":
                print(f"[WorkflowService] Document {document.id} already processed.")
                self.update_workflow(
                    workflow_id=workflow_id,
                    payload=WorkflowUpdate(status="completed"),
                )
                pprint("Document already processsed")
            else:
                self.document_service.process_and_store_document(document_id=document.id, workflow_id=workflow_id,
                                                                 embedding_model=workflow.definition.embeddingModel)


            # ASSISTANT RESPONSE
            new_session = self.chat_service.create_session(
                payload=ChatSessionCreate(
                    workflow_id=workflow_id, name=str(workflow.definition.query)
                )
            )
            pprint(f"[WorkflowService] Created new session: {new_session['id']}")

            assistant_response = await self.chat_service.process_chat_message(
                payload=ChatMessageCreate(message=str(workflow.definition.query)),
                session_id=new_session["id"],
            )

            pprint("[WorkflowService] Processed chat message:", assistant_response)
            self.update_workflow(
                workflow_id=workflow_id,
                payload=WorkflowUpdate(status="completed"),
            )
            return True

        except Exception as e:
            # self.update_workflow(workflow_id, payload=WorkflowUpdate(status="failed"))
            print(f"[WorkflowService] Workflow {workflow_id} was not updated error: \n\n{traceback.format_exc()} ")

        return True
