import os
from pprint import pprint
from typing import List, Any, Optional
from uuid import UUID

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.prompts.chat import ChatPromptTemplate
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings, metadata
from app.schemas.chat import QueryRagOut, SourcesDict
from app.utils.web_search import search_internet

load_dotenv()


def add_to_chroma_db(
        workflow_id: UUID,
        chunks: List[Any],
        embeddings_model: str = settings.DEFAUTL_EMBEDDINGS_MODEL
):
    embeddings = GoogleGenerativeAIEmbeddings(model=embeddings_model)
    vector_store = Chroma(
        collection_name="workflow_collection",
        embedding_function=embeddings,
        persist_directory=settings.CHROMA_PATH,
    )

    for chunk in chunks:
        chunk.metadata['workflow_id'] = str(workflow_id)

    pprint("Adding chunks to Chroma")
    vector_store.add_documents(chunks)


def retrieve_from_rag(
        query: str,
        workflow_id: str,
        top_k: int = 4,
        embeddings_model: str = settings.DEFAUTL_EMBEDDINGS_MODEL
) -> str:
    embeddings = GoogleGenerativeAIEmbeddings(model=embeddings_model)

    vector_store = Chroma(
        collection_name="workflow_collection",
        embedding_function=embeddings,
        persist_directory=settings.CHROMA_PATH,
    )

    results = vector_store.similarity_search_with_score(
        query,
        k=top_k,
        filter={"workflow_id": workflow_id},
    )

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])

    return context_text


def build_context(rag_context: str, web_results: dict | None) -> str:
    parts = []

    if rag_context:
        parts.append("### DOCUMENT CONTEXT\n" + rag_context)

    if web_results:
        web_texts = []
        for article in web_results.get("articles", []):
            web_texts.append(
                f"- {article['title']}: {article['snippet']} ({article['url']})"
            )
        if web_texts:
            parts.append("### WEB CONTEXT\n" + "\n".join(web_texts))

    return "\n\n".join(parts)
def extract_llm_text(content) -> str:

    if content is None:
        return ""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        texts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text")
                if isinstance(text, str):
                    texts.append(text)
        return "\n\n".join(texts)

    return str(content)


def query_from_rag(
        query: str,
        workflow_id: UUID,
        top_k: int = 4,
        search: bool = False,
        embeddings_model: str = settings.DEFAUTL_EMBEDDINGS_MODEL,
        sys_prompt: Optional[str] = None,
        model: str = "gemini-2.5-pro",
        temperature: float = 0.7,
) -> QueryRagOut:
    web_results = None
    if search:
        web_results = search_internet(query)

    rag_context = retrieve_from_rag(
        query=query,
        workflow_id=str(workflow_id),
        top_k=top_k,
        embeddings_model=embeddings_model,
    )

    combined_context = build_context(rag_context, web_results)

    base_system_prompt = (
        metadata.RAG_WITH_WEB_SYSTEM_PROMPT if search
        else metadata.general_system_prompt
    )

    if sys_prompt:
        full_system_prompt = base_system_prompt + "\n\n" + sys_prompt
    else:
        full_system_prompt = base_system_prompt

    prompt_template = ChatPromptTemplate.from_template(
        full_system_prompt + "\n\nContext:\n{context}\n\nQuestion: {question}"
    )

    formatted_prompt = prompt_template.format(
        context=combined_context,
        question=query,
    )

    pprint("🔥 FINAL PROMPT 🔥")
    pprint(formatted_prompt)

    llm = ChatGoogleGenerativeAI(
        model=model,
        api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=temperature,
        max_retries=2,
    )

    response_text = llm.invoke(formatted_prompt)
    final_answer = extract_llm_text(response_text.content)

    pprint("📝 RESPONSE 📝")
    pprint(response_text.content)

    return QueryRagOut(
        answer=str(final_answer),
        used_web=search,
        sources=SourcesDict(
            rag=rag_context,
            web=web_results if search else None,
        )
    )