from supabase import Client
from typing import List, Dict, Any, Optional
from uuid import UUID


class MessagesDAO:
    def __init__(self, client: Client):
        self.client = client

    def list_messages_by_session(self, session_id: UUID) -> List[Dict[str, Any]]:
        """List all messages for a specific session."""
        response = self.client.table("chat_messages").select("*").eq("session_id", str(session_id)).order("created_at").execute()
        return response.data

    def insert_message(self, session_id: UUID, sender: str, message: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Insert a new message into a session."""
        data = {
            "session_id": str(session_id),
            "sender": sender,
            "message": message,
            "metadata": metadata
        }
        response = self.client.table("chat_messages").insert(data).execute()
        return response.data[0]