from uuid import UUID

from supabase import Client
from app.dao.workflows_dao import WorkflowsDao
from app.schemas.workflow import WorkflowOut, WorkflowCreate, WorkflowUpdate


class WorkflowService:
    def __init__(self,client: Client):
        self.workflowDao = WorkflowsDao(client)

    def list_workflows(self):
        workflows = self.workflowDao.list_workflows()
        return [WorkflowOut(**workflow) for workflow in workflows]

    def get_workflow(self, workflow_id: UUID):
        return self.workflowDao.get_workflow(workflow_id)

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