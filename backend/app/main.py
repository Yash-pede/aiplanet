import uuid
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import health, workflows, documents, sessions, messages, metadata
import os
from dotenv import load_dotenv
import traceback

load_dotenv()

setup_logging()

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id_and_handle_exceptions(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    except Exception as e:
        print("🔥 Internal Server Error:", str(e))
        traceback.print_exc()
        raise e  # let FastAPI handle it (CORS headers included)




app.include_router(health.router, prefix=settings.API_PREFIX, tags=["health"])
app.include_router(workflows.router, prefix=settings.API_PREFIX, tags=["workflows"])
app.include_router(documents.router, prefix=settings.API_PREFIX, tags=["documents"])
app.include_router(sessions.router, prefix=settings.API_PREFIX, tags=["sessions"])
app.include_router(messages.router, prefix=settings.API_PREFIX, tags=["messages"])
app.include_router(metadata.router, prefix=settings.API_PREFIX, tags=["metadata"])


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "status": "running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
