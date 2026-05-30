"""
Vector Database — Load and store Northwind policy documents from /files into ChromaDB.
Chunks large .md files by section (##) so ChromaDB handles them correctly.
Run this file directly to populate the vector DB and test searches.
"""

import os
from connectors.vector_connector import add, search, clear

FILES_DIR = os.path.join(os.path.dirname(__file__), "files")


def chunk_by_section(text: str, min_length: int = 100) -> list[str]:
    """Split markdown into sections by ## headings. Skips sections that are too short."""
    chunks = []
    current = []
    for line in text.splitlines():
        if line.startswith("## ") and current:
            chunk = "\n".join(current).strip()
            if len(chunk) >= min_length:
                chunks.append(chunk)
            current = [line]
        else:
            current.append(line)
    if current:
        chunk = "\n".join(current).strip()
        if len(chunk) >= min_length:
            chunks.append(chunk)
    return chunks if chunks else [text]  # fallback: whole doc as one chunk


def load_docs() -> tuple[list[str], list[str]]:
    """Read all .md files, chunk by section. Returns (texts, ids)."""
    texts, ids = [], []
    for filename in sorted(os.listdir(FILES_DIR)):
        if filename.endswith(".md"):
            filepath = os.path.join(FILES_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read().strip()
            doc_id = filename.replace(".md", "")
            chunks = chunk_by_section(content)
            for i, chunk in enumerate(chunks):
                texts.append(chunk)
                ids.append(f"{doc_id}_chunk{i}")
            print(f"   📄 Loaded: {filename} → {len(chunks)} chunks")
    return texts, ids


def populate():
    """Clear and re-populate the vector DB with all chunked policy documents."""
    print("📂 Loading policy documents from /files...\n")
    texts, ids = load_docs()
    clear()
    add(texts, ids=ids)
    print(f"\n✅ Vectorized and stored {len(texts)} chunks from policy documents.\n")


def demo_search():
    """Run sample compliance searches against the vector DB."""
    queries = [
        "insurance requirements for vendors",
        "data encryption and security controls",
        "travel expense reimbursement rules",
        "purchase approval thresholds",
        "breach notification requirements",
    ]

    for q in queries:
        print(f"🔍 Query: {q}")
        results = search(q, n=2)
        for r in results:
            print(f"   [{r['id']}] score={r['score']:.4f} — {r['text'][:100]}...")
        print()


# if __name__ == "__main__":
#     populate()
#     demo_search()
