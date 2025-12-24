from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from dotenv import load_dotenv
import traceback
import uuid

from app.routes import metadata, workflow

app = FastAPI(title=settings.APP_NAME)

load_dotenv()

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
        raise e


app.include_router(metadata.router, prefix=settings.API_PREFIX, tags=["metadata"])
app.include_router(workflow.router, prefix=settings.API_PREFIX+ "/workflows", tags=["workflow"])