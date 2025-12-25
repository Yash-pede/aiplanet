from typing import List
from uuid import UUID

import asyncio
from fastapi import APIRouter, Depends, HTTPException,status
from supabase import Client
from app.routes.deps import supabase_dependency
from app.schemas.document import DocumentOut
from app.schemas.workflow import WorkflowOut, WorkflowUpdate, WorkflowCreate
from app.services.documet_service import DocumentService
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.get("/",response_model=List[WorkflowOut])
async def list_workflows(client: Client = Depends(supabase_dependency)):
    service = WorkflowService(client)
    return service.list_workflows()

@router.post("/",response_model=WorkflowOut, status_code=status
             .HTTP_201_CREATED)
async def create_workflow(payload: WorkflowCreate, client: Client = Depends(supabase_dependency)):
    service = WorkflowService(client)
    try:
        return service.create_workflow(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{workflow_id}",response_model=WorkflowOut)
async def get_workflow(workflow_id: UUID, client: Client = Depends(supabase_dependency)):
    service = WorkflowService(client)
    workflow = service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.put("/{workflow_id}", response_model=WorkflowOut)
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


@router.delete("/{workflow_id}")
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


@router.get("/{workflow_id}/documents", response_model=List[DocumentOut])
async def list_documents_by_workflow(
    workflow_id: UUID, client: Client = Depends(supabase_dependency),
):
    service = DocumentService(client)
    return service.list_documents_by_workflow(workflow_id)


@router.post("/{workflow_id}/execute", response_model=dict)
async def execute_workflow(workflow_id: UUID, client: Client = Depends(supabase_dependency)):
    service = WorkflowService(client)
    service.validate_workflow(workflow_id)

    asyncio.create_task(service.execute_workflow(workflow_id))

    return {"message": "Executing Workflow it may take a while...", "status": "pending"}
