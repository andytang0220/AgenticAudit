"""
Vector Database — Vectorize and store real-world documents using ChromaDB.
Run this file directly to populate the vector DB and test searches.
"""

from connectors.vector_connector import add, search, clear

# ── Real-world documents ──────────────────────────────────────────────────────
DOCS = [
    "Apple Inc. reported a quarterly revenue of $94.8 billion in Q1 2024, driven by strong iPhone 15 sales.",
    "The European Central Bank raised interest rates by 25 basis points to combat persistent inflation across the eurozone.",
    "NASA's Artemis mission aims to return humans to the Moon by 2026, focusing on sustainable lunar exploration.",
    "OpenAI released GPT-4o in May 2024, offering multimodal capabilities including vision, audio, and text.",
    "The World Health Organization declared mpox a global health emergency for the second time in August 2024.",
    "Tesla delivered 443,956 vehicles in Q1 2024, missing analyst expectations amid growing EV market competition.",
    "The Paris 2024 Summer Olympics opened on July 26, featuring a ceremony held along the Seine River.",
    "Amazon Web Services launched a new region in Malaysia, expanding its cloud infrastructure across Southeast Asia.",
    "A 7.4 magnitude earthquake struck Taiwan in April 2024, causing significant damage in Hualien County.",
    "The United Nations climate report warned that global temperatures are on track to exceed 1.5°C above pre-industrial levels.",
]

IDS = [f"doc_{i}" for i in range(len(DOCS))]


def populate():
    """Clear and re-populate the vector DB with all documents."""
    clear()
    add(DOCS, ids=IDS)
    print(f"✅ Vectorized and stored {len(DOCS)} documents.\n")


def demo_search():
    """Run sample semantic searches against the vector DB."""
    queries = [
        "space exploration and moon landing",
        "financial results and revenue",
        "climate change and global warming",
        "electric vehicles sales",
        "health emergency and disease outbreak",
    ]

    for q in queries:
        print(f"🔍 Query: {q}")
        results = search(q, n=2)
        for r in results:
            print(f"   [{r['id']}] score={r['score']:.4f} — {r['text'][:90]}...")
        print()


if __name__ == "__main__":
    populate()
    demo_search()

