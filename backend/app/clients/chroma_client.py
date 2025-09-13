from langchain.vectorstores import Chroma
from .gemini_client import get_gemini_embeddings
import os

CHROMA_PATH = "chroma"  # local folder for persistence

def get_chroma(embedding_model: str):
    embeddings = get_gemini_embeddings(embedding_model=embedding_model)
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embeddings
    )
    return db
