from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from .routes.health import router as health_router
from .routes import workflows
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Workflow Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(workflows.router)


@app.get("/")
def root():
    return {"message": "backend running 🚀"}
