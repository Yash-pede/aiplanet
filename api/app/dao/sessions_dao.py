from supabase import Client
from typing import List, Dict, Any
from uuid import UUID


class SessionsDAO:
    def __init__(self, client: Client):
        self.client = client

    def create_session(self, workflow_id: UUID, name: str):
        data = {"workflow_id": str(workflow_id), "title": name}
        response = self.client.table("chat_sessions").insert(data).execute()
        # print(f"Created session {response.data[0]['id']}\n\n\n\n\n")
        return response.data[0]

    def list_sessions_by_workflow(self, workflow_id: UUID) -> List[Dict[str, Any]]:
        response = (
            self.client.table("chat_sessions")
            .select("*")
            .eq("workflow_id", str(workflow_id))
            .order("created_at", desc=True)
            .execute()
        )
        # print("\n\n\n\n\n\n LIST WORKFLOW",response)
        return response.data

    def get_session(self, session_id: UUID) -> Dict[str, Any]:
        response = (
            self.client.table("chat_sessions")
            .select("*")
            .eq("id", str(session_id))
            .single()
            .execute()
        )
        return response.data
