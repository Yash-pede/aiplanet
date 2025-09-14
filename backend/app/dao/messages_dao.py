from supabase import Client
from typing import List, Dict, Any, Optional
from uuid import UUID


class MessagesDAO:
    def __init__(self, client: Client):
        self.client = client

    def list_messages_by_session(self, session_id: UUID) -> List[Dict[str, Any]]:
        response = (
            self.client.table("chat_messages")
            .select("*")
            .eq("session_id", str(session_id))
            .order("created_at")
            .execute()
        )
        return response.data

    def insert_message(
        self,
        session_id: UUID,
        sender: str,
        message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        data = {
            "session_id": str(session_id),
            "sender": sender,
            "metadata": metadata,
        }
        if message:
            data["message"] = message
        response = self.client.table("chat_messages").insert(data).execute()
        return response.data[0]

    def update_message(
        self, message_id: UUID, message: str, metadata: Optional[Dict[str, Any]] = None
    ):
        response = (
            self.client.table("chat_messages")
            .update({"message": message, "metadata": metadata})
            .eq("id", str(message_id))
            .execute()
        )
        return response.data[0]

    def delete_message(self, message_id: UUID):
        response = (
            self.client.table("chat_messages")
            .delete()
            .eq("id", str(message_id))
            .execute()
        )
        return response.data
