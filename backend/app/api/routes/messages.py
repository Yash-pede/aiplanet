from fastapi import APIRouter, Depends
from supabase import Client
from uuid import UUID

from app.api.deps import get_supabase_user
from app.services.chat_service import ChatService
from app.schemas.chat import ChatMessageCreate, ChatMessageOut

router = APIRouter()


@router.get("/sessions/{session_id}/messages")
async def list_messages(
    session_id: UUID,
    client: Client = Depends(get_supabase_user)
):
    """List all messages in a chat session."""
    service = ChatService(client)
    return service.list_messages(session_id)


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageOut)
async def create_message(
    session_id: UUID,
    payload: ChatMessageCreate,
    client: Client = Depends(get_supabase_user)
):
    """Create a user message, process it, and return the assistant response."""
    service = ChatService(client)
    return service.process_chat_message(session_id, payload)