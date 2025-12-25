from fastapi import APIRouter, Depends
from supabase import Client
from uuid import UUID

from app.routes.deps import supabase_dependency
from app.services.chat_service import ChatService
from app.schemas.chat import ChatMessageCreate, ChatMessageOut
from app.schemas.chat import ChatSessionCreate
import asyncio

router = APIRouter()


@router.get("/sessions/{session_id}/messages")
async def list_messages(session_id: UUID, client: Client = Depends(supabase_dependency)):
    service = ChatService(client)
    return service.list_messages(session_id)


@router.post("/messages")
async def create_message(
    payload: ChatMessageCreate, client: Client = Depends(supabase_dependency)
):
    service = ChatService(client)
    if payload.metadata and payload.metadata.workflow_id and payload.metadata.is_first:
        new_session = service.create_session(
            payload=ChatSessionCreate(
                workflow_id=payload.metadata.workflow_id, name=payload.message
            )
        )
        # print(f"\n\n\n\n\ new session {new_session}\n\n\n\n")

        await service.process_chat_message(session_id=new_session["id"], payload=payload)

        return {"session_id": new_session["id"]}


@router.post("/sessions/{session_id}/messages")
async def create_message_with_session(
    session_id: UUID,
    payload: ChatMessageCreate,
    client: Client = Depends(supabase_dependency),
):
    service = ChatService(client)
    return await service.process_chat_message(session_id, payload)
