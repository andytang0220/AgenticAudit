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


def search(query: str, n: int = 3, collection: str = "default") -> list[dict]:
    """Search for similar texts. Returns list of {id, text, score}."""
    col = get_collection(collection)
    results = col.query(query_texts=[query], n_results=n)
    return [
        {"id": i, "text": d, "score": round(1 - s, 4)}
        for i, d, s in zip(
            results["ids"][0],
            results["documents"][0],
            results["distances"][0],
        )
    ]


def clear(collection: str = "default"):
    """Delete a collection if it exists."""
    try:
        _client.delete_collection(collection)
    except Exception:
        pass

