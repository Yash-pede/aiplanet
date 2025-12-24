from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException,status
from supabase import Client
from app.routes.deps import supabase_dependency
from app.schemas.workflow import WorkflowOut, WorkflowUpdate
from app.services.workflow_service import WorkflowService

router = APIRouter()

@router.get("/",response_model=List[WorkflowOut])
async def list_workflows(client: Client = Depends(supabase_dependency)):
    service = WorkflowService(client)
    return service.list_workflows()

@router.post("/",response_model=WorkflowOut, status_code=status
             .HTTP_201_CREATED)
async def create_workflow(client: Client = Depends(supabase_dependency)):
    service = WorkflowService(client)
    try:
        return service.create_workflow()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{workflow_id}",response_model=WorkflowOut)
async def get_workflow(workflow_id: UUID, client: Client = Depends(supabase_dependency)):
    service = WorkflowService(client)
    workflow = service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.put("/workflows/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(
    workflow_id: UUID,
    payload: WorkflowUpdate,
    client: Client = Depends(supabase_dependency),
):
    service = WorkflowService(client)
    try:
        return service.update_workflow(workflow_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: UUID, client: Client = Depends(supabase_dependency)
):
    """Delete a workflow."""
    service = WorkflowService(client)
    success = service.delete_workflow(workflow_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )
    return {"message": "Workflow deleted successfully"}