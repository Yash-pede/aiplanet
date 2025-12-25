from pprint import pprint
from typing import List, Any
from uuid import UUID

from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import Settings
from langchain.tools import tool


def add_to_chroma_db(workflow_id: UUID, chunks: List[Any], embeddings_model: str = "models/gemini-embedding-001"):
    embeddings = GoogleGenerativeAIEmbeddings(model=embeddings_model)
    vector_store = Chroma(
        collection_name="workflow_collection",
        embedding_function=embeddings,
        persist_directory=Settings.CHROMA_PATH,  # Where to save data locally, remove if not necessary
    )
    for chunk in chunks:
        chunk.metadata['workflow_id'] = str(workflow_id)

    pprint.pp("Adding chunks to Chroma")

    vector_store.aadd_documents(documents=chunks)

@tool(response_format="content_and_artifact")
def retrieve_from_rag(query: str, workflow_id: str):
    """Retrieve context from uploaded workflow documents."""
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001"
    )

    vector_store = Chroma(
        collection_name="workflow_collection",
        embedding_function=embeddings,
        persist_directory=Settings.CHROMA_PATH,
    )

    docs = vector_store.similarity_search(
        query,
        k=4,
        filter={"workflow_id": workflow_id},
    )

    text = "\n\n".join(
        f"[RAG] {doc.page_content}"
        for doc in docs
    )

    return text, docs
