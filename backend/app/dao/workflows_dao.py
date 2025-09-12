from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID


class WorkflowsDAO:
    def __init__(self, client: Client):
        self.client = client

    def list_workflows(self) -> List[Dict[str, Any]]:
        response = self.client.table("workflows").select("*").execute()
        return response.data

    def get_workflow(self, workflow_id: UUID) -> Optional[Dict[str, Any]]:
        response = (
            self.client.table("workflows")
            .select("*")
            .eq("id", str(workflow_id))
            .single()
            .execute()
        )
        return response.data

    def create_workflow(
        self, name: str, description: Optional[str]
    ) -> Dict[str, Any]:
        data = {"name": name, "description": description}
        response = self.client.table("workflows").insert(data).execute()
        return response.data[0]

    def update_workflow(
        self,
        workflow_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        definition: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        data = {}
        if name is not None:
            data["name"] = name
        if description is not None:
            data["description"] = description
        if definition is not None:
            data["definition"] = definition

        response = (
            self.client.table("workflows")
            .update(data)
            .eq("id", str(workflow_id))
            .execute()
        )
        return response.data[0]

    def delete_workflow(self, workflow_id: UUID) -> bool:
        response = (
            self.client.table("workflows").delete().eq("id", str(workflow_id)).execute()
        )
        return len(response.data) > 0
