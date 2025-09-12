from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.clients.supabase_client import supabase_service_client, supabase_user_client

security = HTTPBearer()


def get_bearer_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if credentials.scheme != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme"
        )
    return credentials.credentials


def get_supabase_user(token: str = Depends(get_bearer_token)) -> Client:
    try:
        client = supabase_user_client(token)
        return client
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


def get_supabase_service() -> Client:
    """Get service-scoped Supabase client."""
    return supabase_service_client()
