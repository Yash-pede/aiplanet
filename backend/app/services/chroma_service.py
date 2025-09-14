import os
import shutil
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from app.clients.gemini_client import get_gemini_embedding_function
from langchain.vectorstores.chroma import Chroma
from app.core.config import settings, metadata
from langchain.vectorstores.chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Optional

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""


def split_documents(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=80,
        length_function=len,
        is_separator_regex=False,
    )
    return text_splitter.split_documents(documents)


def add_to_chroma(chunks: list[Document]):
    db = Chroma(
        persist_directory=settings.CHROMA_PATH,
        embedding_function=get_gemini_embedding_function(),
    )

    chunks_with_ids = calculate_chunk_ids(chunks)

    # Add or Update the documents.
    existing_items = db.get(include=[])  # IDs are always included by default
    existing_ids = set(existing_items["ids"])
    print(f"Number of existing documents in DB: {len(existing_ids)}")

    # Only add documents that don't exist in the DB.
    new_chunks = []
    for chunk in chunks_with_ids:
        if chunk.metadata["id"] not in existing_ids:
            new_chunks.append(chunk)

    if len(new_chunks):
        print(f"👉 Adding new documents: {len(new_chunks)}")
        new_chunk_ids = [chunk.metadata["id"] for chunk in new_chunks]
        db.add_documents(new_chunks, ids=new_chunk_ids)
        db.persist()
    else:
        print("✅ No new documents to add")


def calculate_chunk_ids(chunks):

    # This will create IDs like "data/monopoly.pdf:6:2"
    # Page Source : Page Number : Chunk Index

    last_page_id = None
    current_chunk_index = 0

    for chunk in chunks:
        source = chunk.metadata.get("source")
        page = chunk.metadata.get("page")
        current_page_id = f"{source}:{page}"

        # If the page ID is the same as the last one, increment the index.
        if current_page_id == last_page_id:
            current_chunk_index += 1
        else:
            current_chunk_index = 0

        # Calculate the chunk ID.
        chunk_id = f"{current_page_id}:{current_chunk_index}"
        last_page_id = current_page_id

        # Add it to the page meta-data.
        chunk.metadata["id"] = chunk_id

    return chunks


def clear_database():
    if os.path.exists(settings.CHROMA_PATH):
        shutil.rmtree(settings.CHROMA_PATH)


def query_rag(
    query_text: str,
    system_prompt: str,
    model: str ,
    temperature: float,
    top_k: int = 5,
):
    # Prepare the DB.
    embedding_function = get_gemini_embedding_function()
    db = Chroma(
        persist_directory=settings.CHROMA_PATH, embedding_function=embedding_function
    )

    # Search the DB.
    results = db.similarity_search_with_score(query_text, k=top_k)
    print(f"Found {len(results)} {results} relevant chunks.")

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(system_prompt + PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    print("\n\n\n\nPROMPTTTTTTTTTTTTTTTTTTT: ", prompt)

    llm = ChatGoogleGenerativeAI(
        model=model,
        temperature=temperature,
        max_tokens=None,
        timeout=None,
        max_retries=2,
        )
    response_text = llm.invoke(prompt)

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    formatted_response = f"\n\n\n\n\n\nResponse: {response_text}\nSources: {sources}"
    print(formatted_response)
    return str(response_text.content)
