from supabase import Client
from typing import Dict, Any
from uuid import UUID
from app.dao.sessions_dao import SessionsDAO
from app.dao.messages_dao import MessagesDAO
from app.schemas.chat import ChatSessionCreate, ChatMessageCreate, ChatMessageOut


class ChatService:
    def __init__(self, client: Client):
        self.sessions_dao = SessionsDAO(client)
        self.messages_dao = MessagesDAO(client)

    def create_session(self, payload: ChatSessionCreate) -> Dict[str, Any]:
        """Create a new chat session."""
        session = self.sessions_dao.create_session(payload.workflow_id)
        return session

    def list_sessions_by_workflow(self, workflow_id: UUID) -> list:
        """List all sessions for a workflow."""
        return self.sessions_dao.list_sessions_by_workflow(workflow_id)

    def append_user_message(self, session_id: UUID, payload: ChatMessageCreate) -> ChatMessageOut:
        """Append a user message to the session."""
        message = self.messages_dao.insert_message(
            session_id=session_id,
            sender="user",
            message=payload.message
        )
        return ChatMessageOut(**message)

    def generate_assistant_response(self, session_id: UUID, user_message: str) -> str:
        """Generate assistant response. Placeholder implementation."""
        # TODO: Implement actual retrieval and LLM logic
        return f"Assistant response to: {user_message}"

    def append_assistant_message(self, session_id: UUID, message: str, metadata: Dict[str, Any] = None) -> ChatMessageOut:
        """Append an assistant message to the session."""
        message_data = self.messages_dao.insert_message(
            session_id=session_id,
            sender="llm",
            message=message,
            metadata=metadata
        )
        return ChatMessageOut(**message_data)

    def process_chat_message(self, session_id: UUID, payload: ChatMessageCreate) -> ChatMessageOut:
        """Process a complete chat interaction."""
        # 1. Store user message
        self.append_user_message(session_id, payload)
        
        # 2. Generate assistant response
        assistant_response = self.generate_assistant_response(session_id, payload.message)
        
        # 3. Store and return assistant message
        return self.append_assistant_message(session_id, assistant_response)

    def list_messages(self, session_id: UUID) -> list:
        """List all messages in a session."""
        messages = self.messages_dao.list_messages_by_session(session_id)
        return [ChatMessageOut(**msg) for msg in messages]