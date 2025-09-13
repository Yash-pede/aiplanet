from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):

    APP_NAME: str = "Ai Planet"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    CORS_ORIGINS: list[str] = Field(default=["*"])

    SUPABASE_URL: str = Field(default=os.getenv("SUPABASE_URL", ""))
    SUPABASE_ANON_KEY: str = Field(default=os.getenv("SUPABASE_ANON_KEY", ""))
    # SUPABASE_SERVICE_KEY: str = None


settings = Settings()

class metadata:
    embedding_models = ["models/gemini-embedding-001"]