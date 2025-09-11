import uuid
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import health, workflows
import os
from dotenv import load_dotenv

load_dotenv() 

setup_logging()

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal server error",
                "request_id": request_id,
            },
            headers={"X-Request-ID": request_id}
        )


app.include_router(health.router, prefix=settings.API_PREFIX, tags=["health"])
app.include_router(workflows.router, prefix=settings.API_PREFIX, tags=["workflows"])
# app.include_router(documents.router, prefix=settings.API_PREFIX, tags=["documents"])
# app.include_router(sessions.router, prefix=settings.API_PREFIX, tags=["sessions"])
# app.include_router(messages.router, prefix=settings.API_PREFIX, tags=["messages"])


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
