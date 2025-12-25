

from typing import List, Dict, Any, Optional
from serpapi.google_search import GoogleSearch
from dotenv import load_dotenv
import os

load_dotenv()


def extract_answer(result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Try multiple places to extract a direct answer
    """
    answer_box = result.get("answer_box")
    if answer_box and answer_box.get("answer"):
        return {
            "text": answer_box.get("answer"),
            "source": answer_box.get("title"),
            "link": answer_box.get("link"),
            "thumbnail": answer_box.get("thumbnail"),
        }

    ai_overview = result.get("ai_overview")
    if ai_overview:
        text_blocks = ai_overview.get("text_blocks", [])
        if text_blocks:
            return {
                "text": text_blocks[0].get("snippet"),
                "source": "AI Overview",
                "link": None,
                "thumbnail": None,
            }

    knowledge_graph = result.get("knowledge_graph")
    if knowledge_graph and knowledge_graph.get("description"):
        return {
            "text": knowledge_graph.get("description"),
            "source": knowledge_graph.get("title"),
            "link": knowledge_graph.get("source", {}).get("link"),
            "thumbnail": None,
        }

    return None


def serialize_articles(organic_results: list, limit: int = 4) -> List[Dict[str, Any]]:
    articles = []

    for item in organic_results[:limit]:

        if item.get("video_link"):
            continue

        articles.append({
            "type": "article",
            "title": item.get("title"),
            "snippet": item.get("snippet"),
            "url": item.get("link"),
            "source": item.get("source"),
            "favicon": item.get("favicon"),
        })

    return articles


def serialize_videos(organic_results: list, limit: int = 2) -> List[Dict[str, Any]]:
    videos = []

    for item in organic_results:
        if item.get("video_link") or item.get("thumbnail"):
            videos.append({
                "type": "video",
                "title": item.get("title"),
                "url": item.get("link"),
                "video_url": item.get("video_link") or item.get("link"),
                "thumbnail": item.get("thumbnail"),
                "duration": item.get("duration"),
                "source": item.get("source"),
            })

        if len(videos) >= limit:
            break

    return videos


def serialize_short_videos(short_videos: list, limit: int = 3) -> List[Dict[str, Any]]:
    results = []

    for item in short_videos[:limit]:
        results.append({
            "type": "short_video",
            "title": item.get("title"),
            "url": item.get("link"),
            "video_url": item.get("clip") or item.get("link"),
            "thumbnail": item.get("thumbnail"),
            "duration": item.get("duration"),
            "source": item.get("source"),
            "profile": item.get("profile_name"),
            "source_logo": item.get("source_logo"),
        })

    return results


def search_internet(query: str) -> Dict[str, Any]:
    params = {
        "q": query,
        "location": "India",
        "hl": "en",
        "gl": "in",
        "google_domain": "google.com",
        "api_key": os.getenv("SERPAPI_API_KEY"),
    }

    search = GoogleSearch(params)
    result = search.get_dict()

    organic_results = result.get("organic_results", [])
    short_videos = result.get("short_videos", [])

    return {
        "type": "search",
        "query": query,
        "answer": extract_answer(result),
        "articles": serialize_articles(organic_results),
        "videos": serialize_videos(organic_results),
        "short_videos": serialize_short_videos(short_videos),
    }


