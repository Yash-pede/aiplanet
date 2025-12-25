from supabase import Client
from typing import List, Dict, Any, Optional
from uuid import UUID
import json


class MessagesDAO:
    def __init__(self, client: Client):
        self.client = client

    def list_messages_by_session(self, session_id: UUID) -> List[Dict[str, Any]]:
        """List all messages for a given session."""
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
            role: str,
            message: Optional[str] = None,
            metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Insert a new message with proper metadata serialization."""

        # Serialize metadata to ensure JSON compatibility
        serialized_metadata = self._serialize_metadata(metadata)

        data = {
            "session_id": str(session_id),
            "role": role,
            "metadata": serialized_metadata,
        }

        if message not in ["", None]:
            data["message"] = message
            print(f"\n\nInserting message: {data}\n")

        response = self.client.table("chat_messages").insert(data).execute()
        return response.data[0]

    def update_message(
            self,
            message_id: UUID,
            message: str,
            metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update a message with proper metadata serialization."""

        # Serialize metadata to ensure JSON compatibility
        serialized_metadata = self._serialize_metadata(metadata)

        update_data = {
            "message": message,
            "metadata": serialized_metadata
        }

        print(f"\n\nUpdating message {message_id} with data: {update_data}\n")

        response = (
            self.client.table("chat_messages")
            .update(update_data)
            .eq("id", str(message_id))
            .execute()
        )

        if not response.data:
            raise ValueError(f"No message found with id {message_id}")

        print(f"Update response: {response}\n")
        return response.data[0]

    def delete_message(self, message_id: UUID) -> List[Dict[str, Any]]:
        """Delete a message by ID."""
        response = (
            self.client.table("chat_messages")
            .delete()
            .eq("id", str(message_id))
            .execute()
        )
        return response.data

    def _serialize_metadata(self, metadata: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Recursively serialize metadata to ensure JSON compatibility.
        Handles Pydantic models, custom objects, and nested structures.
        """
        if metadata is None:
            return None

        if not isinstance(metadata, dict):
            return None

        serialized = {}

        for key, value in metadata.items():
            serialized[key] = self._serialize_value(value)

        return serialized

    def _serialize_value(self, value: Any) -> Any:
        """Serialize a single value to be JSON-compatible."""

        # None values
        if value is None:
            return None

        # Pydantic v2 models (has model_dump method)
        if hasattr(value, 'model_dump'):
            return value.model_dump()

        # Pydantic v1 models (has dict method)
        if hasattr(value, 'dict'):
            return value.dict()

        # Regular dictionaries - recurse
        if isinstance(value, dict):
            return {k: self._serialize_value(v) for k, v in value.items()}

        # Lists and tuples
        if isinstance(value, (list, tuple)):
            return [self._serialize_value(item) for item in value]

        # Primitive JSON-serializable types
        if isinstance(value, (str, int, float, bool)):
            return value

        # UUID objects
        if isinstance(value, UUID):
            return str(value)

        # Try JSON serialization as a test
        try:
            json.dumps(value)
            return value
        except (TypeError, ValueError):
            pass

        # Fallback: convert to string representation
        try:
            return str(value)
        except Exception:
            return repr(value)

