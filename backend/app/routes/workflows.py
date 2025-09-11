from fastapi import APIRouter, Depends
from app.dependencies import get_supabase
from fastapi import FastAPI, HTTPException

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("/")
def list_workflows(supabase=Depends(get_supabase)):
    response = supabase.table("workflows").select("*").execute()
    if response.error:
        raise HTTPException(status_code=response.status, detail="Error fetching workflows")
    return response.data
