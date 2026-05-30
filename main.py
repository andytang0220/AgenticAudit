from connectors.deepseek_connector import deepseek_chat
from connectors.vector_connector import search
from vector_database import populate

if __name__ == '__main__':
    # ── Vectorize & store docs ────────────────────────────────────────────────
    # ── Search examples ───────────────────────────────────────────────────────
    queries = [
        "space exploration and moon landing",
        "financial results and revenue",
        "climate change and global warming",
    ]

    for q in queries:
        print(f"🔍 Query: {q}")
        results = search(q, n=2)
        for r in results:
            print(f"   [{r['id']}] score={r['score']:.4f} — {r['text'][:80]}...")
        print()

    # ── RAG: retrieve + summarize with DeepSeek ───────────────────────────────
    top = search("electric vehicles sales", n=1)[0]
    print(f"📄 Top match for 'electric vehicles sales':\n   {top['text']}\n")
    answer = deepseek_chat(f"Summarize this news in one sentence: {top['text']}")
    print(f"🤖 DeepSeek summary: {answer}")
