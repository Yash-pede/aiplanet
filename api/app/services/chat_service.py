from pprint import pprint
from typing import Dict, Any, Optional
from uuid import UUID

from supabase import Client

from app.core.config import settings
from app.dao.messages_dao import MessagesDAO
from app.dao.sessions_dao import SessionsDAO
from app.dao.workflows_dao import WorkflowsDao
from app.schemas.chat import ChatSessionCreate, ChatMessageCreate, ChatMessageOut, QueryRagOut
from app.schemas.workflow import WorkflowOut
from app.services.llm_service import query_from_rag


class ChatService:
    def __init__(self, client: Client):
        self.sessions_dao = SessionsDAO(client)
        self.messages_dao = MessagesDAO(client)
        self.workflows_dao = WorkflowsDao(client)

    def create_session(self, payload: ChatSessionCreate):
        return self.sessions_dao.create_session(payload.workflow_id, payload.name)

    def list_sessions_by_workflow(self, workflow_id: UUID) -> list:
        return self.sessions_dao.list_sessions_by_workflow(workflow_id)

    def append_user_message(
            self, session_id: UUID, payload: ChatMessageCreate, search: bool = False
    ) -> ChatMessageOut:
        message = self.messages_dao.insert_message(
            session_id=session_id, role="user", message=payload.message, metadata=dict({
                "search": search
            })
        )
        return ChatMessageOut(**message)

    def generate_assistant_message(self,
                                   user_message: str,
                                   system_prompt: Optional[str],
                                   workflow_id: UUID,
                                   temperature: float = 0.7,
                                   model: str = "gemini-2.5-pro",
                                   embeddingModel: str = settings.DEFAUTL_EMBEDDINGS_MODEL,
                                   search: bool = False) -> QueryRagOut:
        response = query_from_rag(
            temperature=temperature,
            sys_prompt=system_prompt,
            workflow_id=workflow_id,
            embeddings_model=embeddingModel,
            query=user_message,
            search=search,
            model=model
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
            self, session_id: UUID
    ) -> ChatMessageOut:
        message_data = self.messages_dao.insert_message(
            session_id=session_id, role="assistant", metadata={"status": "generating"}
        )
        return ChatMessageOut(**message_data)

    def list_messages(self, session_id: UUID) -> list:
        """List all messages in a session."""
        messages = self.messages_dao.list_messages_by_session(session_id)
        return [ChatMessageOut(**msg) for msg in messages]

    async def process_chat_message(
            self, session_id: UUID, payload: ChatMessageCreate
    ) -> ChatMessageOut:
        session = self.sessions_dao.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        workflow_response = self.workflows_dao.get_workflow(
            workflow_id=session["workflow_id"]
        )
        workflow = WorkflowOut(**workflow_response)
        self.append_user_message(session_id, payload)
        message_data = self.create_generating_assistant_message(session_id)
        pprint("Generating assistant message")
        assistant_response = self.generate_assistant_message(
            user_message=payload.message,
            system_prompt=workflow.definition.prompt,
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
            embeddingModel = workflow.definition.embeddingModel,
            search = payload.metadata.search if payload.metadata else False
        )
        pprint(f"Assistant message: {assistant_response}")
        return self.append_assistant_message(
            message=assistant_response.answer, message_id=message_data.id,
            metadata={
                "sources": assistant_response.sources,
                "used_web": assistant_response.used_web,
            }
        )
