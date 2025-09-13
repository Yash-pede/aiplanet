from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from app.dao.workflows_dao import WorkflowsDAO
from app.schemas.workflow import WorkflowCreate, WorkflowOut, WorkflowUpdate


class WorkflowsService:
    def __init__(self, client: Client):
        self.dao = WorkflowsDAO(client)

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

    def update_workflow(self, workflow_id: UUID, payload: WorkflowUpdate) -> WorkflowOut:
        # if payload.definition is None or not isinstance(payload.definition, dict) :
        #     raise ValueError("Workflow definition must be a dictionary")
        
        workflow = self.dao.update_workflow(
            workflow_id=workflow_id,
            name=payload.name,
            description=payload.description,
            definition=payload.definition
        )
        return WorkflowOut(**workflow)

    def delete_workflow(self, workflow_id: UUID) -> bool:
        return self.dao.delete_workflow(workflow_id)
