from fastapi import APIRouter
from app.core.config import metadata

router = APIRouter()


@router.get("/metadata/available-embedding-models")
async def available_embedding_models():
    return metadata.embedding_models
@router.get("/metadata/available-llm-models")
async def available_llm_models():
    return metadata.llm_models
