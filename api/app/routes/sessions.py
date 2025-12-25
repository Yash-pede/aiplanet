from fastapi import APIRouter, Depends, status
from supabase import Client
from typing import List
from uuid import UUID

from app.routes.deps import supabase_dependency
from app.services.chat_service import ChatService
from app.schemas.chat import ChatSessionCreate

router = APIRouter()


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: ChatSessionCreate,
    client: Client = Depends(supabase_dependency)
):
    service = ChatService(client)
    return service.create_session(payload)


@router.get("/workflows/{workflow_id}/sessions")
async def list_sessions_by_workflow(
    workflow_id: UUID,
    client: Client = Depends(supabase_dependency)
):
    service = ChatService(client)
    return service.list_sessions_by_workflow(workflow_id)