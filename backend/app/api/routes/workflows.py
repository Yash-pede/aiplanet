from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from supabase import Client
from typing import List
from uuid import UUID

from app.api.deps import get_supabase_user
from app.services.workflows_service import WorkflowsService
from app.schemas.workflow import WorkflowCreate, WorkflowOut, WorkflowUpdate

from app.services.documents_service import DocumentsService
from app.schemas.document import DocumentOut


import asyncio


router = APIRouter()


@router.get("/workflows", response_model=List[WorkflowOut])
async def list_workflows(client: Client = Depends(get_supabase_user)):
    service = WorkflowsService(client)
    return service.list_workflows()


@router.post(
    "/workflows", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED
)
async def create_workflow(
    payload: WorkflowCreate, client: Client = Depends(get_supabase_user)
):
    service = WorkflowsService(client)
    try:
        return service.create_workflow(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/workflows/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(workflow_id: UUID, client: Client = Depends(get_supabase_user)):
    """Get a specific workflow by ID."""
    service = WorkflowsService(client)
    workflow = service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )
    return workflow


@router.put("/workflows/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(
    workflow_id: UUID,
    payload: WorkflowUpdate,
    client: Client = Depends(get_supabase_user),
):
    service = WorkflowsService(client)
    try:
        return service.update_workflow(workflow_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: UUID, client: Client = Depends(get_supabase_user)
):
    """Delete a workflow."""
    service = WorkflowsService(client)
    success = service.delete_workflow(workflow_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )
    return {"message": "Workflow deleted successfully"}


@router.get("/workflows/{workflow_id}/documents", response_model=List[DocumentOut])
async def list_documents_by_workflow(
    workflow_id: UUID, client: Client = Depends(get_supabase_user),
):
    service = DocumentsService(client)
    return service.list_documents_by_workflow(workflow_id)

@router.post("/workflows/{workflow_id}/execute", response_model=dict)
async def execute_workflow(workflow_id: UUID, client: Client = Depends(get_supabase_user)):
    service = WorkflowsService(client)

    asyncio.create_task(service.execute_workflow(workflow_id))

    return {"message": "Executing Workflow it may take a while...", "status": "pending"}
