from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os
from pydantic import SecretStr
from dotenv import load_dotenv

load_dotenv()


def get_gemini_embedding_function(embedding_model: str = "models/gemini-embedding-001"):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("⚠️ GOOGLE_API_KEY not set in environment")

    embeddings = GoogleGenerativeAIEmbeddings(
        model=embedding_model,
        task_type="RETRIEVAL_DOCUMENT",  # default for docs
        google_api_key=SecretStr(api_key),  # Cast the string to SecretStr
    )

    return embeddings
