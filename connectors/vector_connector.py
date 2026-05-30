"""
Simple vector store using ChromaDB with built-in embeddings.
No extra model downloads needed — just: pip install chromadb
"""

import chromadb
import os

_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
_client = chromadb.PersistentClient(path=_DB_PATH)

RELEVANCE_THRESHOLD = 0.3


def get_collection(name: str = "default"):
    return _client.get_or_create_collection(name)


def add(texts: list[str], ids: list[str] = None, collection: str = "default"):
    """Upsert texts into the vector store (adds or updates existing docs)."""
    col = get_collection(collection)
    if ids is None:
        ids = [str(i) for i in range(len(texts))]
    col.upsert(documents=texts, ids=ids)  # upsert avoids stale UUID issues from delete+add
    return ids


def search(query: str, n: int = 3, collection: str = "default", min_score: float = RELEVANCE_THRESHOLD) -> list[dict]:
    """
    Search for similar texts. Returns list of {id, text, score}.
    - Always fetches a fresh collection reference.
    - Clamps score to [0, 1].
    - Filters by min_score threshold but always returns at least 1 doc as fallback.
    """
    col = get_collection(collection)
    results = col.query(query_texts=[query], n_results=n)

    all_results = [
        {"id": i, "text": d, "score": round(max(0.0, min(1.0, 1 - s)), 4)}
        for i, d, s in zip(
            results["ids"][0],
            results["documents"][0],
            results["distances"][0],
        )
        if i is not None and d is not None  # guard against None entries
    ]

    filtered = [r for r in all_results if r["score"] >= min_score]
    return filtered if filtered else all_results[:1]


def clear(collection: str = "default"):
    """Remove all documents from a collection without deleting it (preserves UUID)."""
    try:
        col = get_collection(collection)
        existing = col.get()
        if existing["ids"]:
            col.delete(ids=existing["ids"])
    except Exception:
        pass
