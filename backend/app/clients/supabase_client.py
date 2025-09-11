from supabase import create_client, Client
from app.core.config import settings


def supabase_service_client() -> Client:
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY,
    )
    return client


def supabase_user_client(access_token: str) -> Client:
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY,
    )

    client.auth.set_session(access_token, "")
    client.postgrest.auth(access_token)

    return client
