from supabase import Client
from typing import Dict, Any, Optional
from uuid import UUID
from app.dao.sessions_dao import SessionsDAO
from app.dao.messages_dao import MessagesDAO
from app.dao.workflows_dao import WorkflowsDAO
from app.schemas.chat import ChatSessionCreate, ChatMessageCreate, ChatMessageOut
from .chroma_service import query_rag
from app.core.config import metadata
from app.schemas.workflow import WorkflowOut


class ChatService:
    def __init__(self, client: Client):
        self.sessions_dao = SessionsDAO(client)
        self.messages_dao = MessagesDAO(client)
        self.workflows__dao = WorkflowsDAO(client)

    def create_session(self, payload: ChatSessionCreate):
        session = self.sessions_dao.create_session(payload.workflow_id, payload.name)
        return session

    def list_sessions_by_workflow(self, workflow_id: UUID) -> list:
        return self.sessions_dao.list_sessions_by_workflow(workflow_id)

    def append_user_message(
        self, session_id: UUID, payload: ChatMessageCreate
    ) -> ChatMessageOut:
        message = self.messages_dao.insert_message(
            session_id=session_id, role="user", message=payload.message
        )
        return ChatMessageOut(**message)

    def generate_assistant_response(
        self,
        user_message: str,
        system_prompt: str,
        workflow_id: UUID,
        temperature: float = 0.7,
        model: str = "gemini-2.5-pro",
    ) -> str:
        response = query_rag(
            query_text=user_message,
            model=model,
            system_prompt=system_prompt,
            temperature=temperature,
            workflow_id=str(workflow_id),
        )

        return response

    def append_assistant_message(
        self,
        message: str,
        message_id: UUID,
        metadata: Dict[str, Any] = None,
    ) -> ChatMessageOut:
        message_data = self.messages_dao.update_message(
            message_id=message_id, message=message, metadata=metadata
        )
        return ChatMessageOut(**message_data)

    def create_generating_assistant_message(
        self, session_id: UUID, metadata: Dict[str, Any] = None
    ) -> ChatMessageOut:
        message_data = self.messages_dao.insert_message(
            session_id=session_id, role="assistant", metadata=metadata
        )
        return ChatMessageOut(**message_data)

    async def process_chat_message(
        self, session_id: UUID, payload: ChatMessageCreate
    ) -> ChatMessageOut:
        session = self.sessions_dao.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        workflow_response = self.workflows__dao.get_workflow(
            workflow_id=session["workflow_id"]
        )
        workflow = WorkflowOut(**workflow_response)
        self.append_user_message(session_id, payload)
        message_data = self.create_generating_assistant_message(
            session_id, metadata={"status": "generating"}
        )

        # 2. Generate assistant response
        assistant_response = self.generate_assistant_response(
            user_message=payload.message,
            system_prompt=(
                workflow.definition.prompt
                if workflow and workflow.definition and workflow.definition.prompt
                else metadata.general_system_prompt
            ),
            temperature=(
                workflow.definition.temperature
                if workflow
                and workflow.definition
                and workflow.definition.temperature is not None
                else 0.7
            ),
            model=(
                workflow.definition.llmModel
                if workflow and workflow.definition and workflow.definition.llmModel
                else "gemini-2.5-flash"
            ),
            workflow_id=session["workflow_id"],
        )

        # 3. Store and return assistant message
        return self.append_assistant_message(
            message=assistant_response, message_id=message_data.id
        )

    def list_messages(self, session_id: UUID) -> list:
        """List all messages in a session."""
        messages = self.messages_dao.list_messages_by_session(session_id)
        return [ChatMessageOut(**msg) for msg in messages]
