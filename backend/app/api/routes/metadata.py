from fastapi import APIRouter
from app.core.config import metadata

router = APIRouter()


@router.get("/metadata/available-embedding-models")
async def available_embedding_models():
    return metadata.embedding_models
