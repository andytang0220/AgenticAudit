"""
Simple vector store using ChromaDB with built-in embeddings.
No extra model downloads needed — just: pip install chromadb
"""

import chromadb
import os

_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
_client = chromadb.PersistentClient(path=_DB_PATH)


def get_collection(name: str = "default"):
    return _client.get_or_create_collection(name)


def add(texts: list[str], ids: list[str] = None, collection: str = "default"):
    """Add texts to the vector store."""
    col = get_collection(collection)
    if ids is None:
        ids = [str(i) for i in range(len(texts))]
    col.add(documents=texts, ids=ids)
    return ids


RELEVANCE_THRESHOLD = 0.1 # Minimum relevance score (0–1). Docs below this are weak matches.

def search(query: str, n: int = 3, collection: str = "default", min_score: float = RELEVANCE_THRESHOLD) -> list[dict]:
    """
    Search for similar texts. Returns list of {id, text, score}.
    - Filters results below min_score threshold.
    - Always returns at least 1 doc (the best match) even if it falls below threshold,
      so the agent always has context to work with.
    """
    col = get_collection(collection)
    results = col.query(query_texts=[query], n_results=n)

    all_results = [
        {"id": i, "text": d, "score": round(1 - s, 4)}
        for i, d, s in zip(
            results["ids"][0],
            results["documents"][0],
            results["distances"][0],
        )
    ]

    # Filter by threshold
    filtered = [r for r in all_results if r["score"] >= min_score]

    # Always return at least the top 1 result as fallback
    return filtered if filtered else all_results[:1]


def clear(collection: str = "default"):
    """Delete a collection if it exists."""
    try:
        _client.delete_collection(collection)
    except Exception:
        pass

