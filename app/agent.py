"""
Two-step RAG Agent:
  Step 1a — Semantic search on ChromaDB (internal policy docs)
  Step 1b — Live web search via Brightdata SERP API
  Step 2  — Combine both into one structured prompt → DeepSeek → final answer
"""

import asyncio
import logging
import time
from pydantic import BaseModel
from connectors.vector_connector import search, RELEVANCE_THRESHOLD
from connectors.deepseek_connector import deepseek_chat
from connectors.brightdata_connector import fetch_web_results

# ── Logger ─────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("agent")


# ── Prompts ────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert compliance and policy analyst assistant.

You have access to two sources of information:
1. **Internal Policy Documents** — official company policy docs retrieved from the knowledge base.
2. **Live Web Intelligence** — real-time compliance data fetched from the web.

Your responsibilities:
- Synthesize both sources to give a comprehensive, accurate answer.
- Prioritize internal policy documents for company-specific rules.
- Use web results to enrich with current regulations, trends, or external context.
- Always cite which source supports each point (e.g. "Per internal policy..." or "According to recent web results...").
- Be concise, structured, and factual.
- If a source lacks relevant info, say so — do not fabricate."""

USER_PROMPT_TEMPLATE = """## SOURCE 1 — Internal Policy Documents
{internal_context}

---

## SOURCE 2 — Live Web Intelligence
{web_context}

---

## User Question
{query}

## Instructions
Using BOTH sources above, provide a comprehensive and well-structured answer.
Reference specific sources where applicable."""


# ── Response schema ────────────────────────────────────────────────────────────
class AgentResponse(BaseModel):
    answer: str
    internal_sources: list[str]
    web_results_used: bool


# ── Agent ──────────────────────────────────────────────────────────────────────
async def run_rag_agent(query: str, n_docs: int = 3) -> AgentResponse:
    """
    Two-step agent pipeline:
    Step 1: Run ChromaDB search + Brightdata web search in parallel
    Step 2: Combine results into one prompt → DeepSeek → final answer
    """
    start = time.time()
    logger.info(f"🚀 New query received: '{query}' (n_docs={n_docs})")

    # Step 1: Run both searches in parallel
    logger.info("⚡ Step 1: Running ChromaDB + Brightdata searches in parallel...")
    step1_start = time.time()
    loop = asyncio.get_event_loop()
    db_task = loop.run_in_executor(None, search, query, n_docs)
    web_task = loop.run_in_executor(None, fetch_web_results, query)
    docs, web_results = await asyncio.gather(db_task, web_task)
    logger.info(f"✅ Step 1 complete in {time.time() - step1_start:.2f}s — "
                f"ChromaDB: {len(docs)} doc(s), Brightdata: {'success' if 'error' not in web_results.lower() else 'failed'}")

    # Log ChromaDB results
    for i, d in enumerate(docs):
        logger.info(f"   📄 [Doc {i+1}] id={d['id']} score={d['score']:.4f}")

    # Log Brightdata results preview (first 300 chars)
    web_preview = web_results[:300].replace("\n", " ").strip()
    logger.info(f"   🌐 Brightdata preview: {web_preview}...")

    # Step 2a: Format internal policy context
    if docs:
        low_relevance = all(d["score"] < RELEVANCE_THRESHOLD for d in docs)
        if low_relevance:
            logger.warning(f"⚠️  All docs below relevance threshold ({RELEVANCE_THRESHOLD}) — low confidence retrieval")
        internal_context = "\n\n".join(
            [f"[Doc {i+1}] (relevance: {d['score']:.2f}) [{d['id']}]\n{d['text']}" for i, d in enumerate(docs)]
        )
        if low_relevance:
            internal_context += "\n\n⚠️ Note: These documents have low relevance scores — use with caution."
    else:
        logger.warning("⚠️  No internal documents found for query")
        internal_context = "No relevant internal documents found."

    # Step 2b: Build full prompt and call DeepSeek
    logger.info("🤖 Step 2: Sending combined prompt to DeepSeek...")
    step2_start = time.time()
    full_prompt = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(internal_context=internal_context, web_context=web_results, query=query)}"
    answer = deepseek_chat(full_prompt)
    logger.info(f"✅ Step 2 complete in {time.time() - step2_start:.2f}s — answer length: {len(answer)} chars")

    logger.info(f"🏁 Total pipeline time: {time.time() - start:.2f}s")

    return AgentResponse(
        answer=answer,
        internal_sources=[f"[Doc {i+1}] {d['id']} (score: {d['score']:.2f})" for i, d in enumerate(docs)],
        web_results_used="error" not in web_results.lower(),
    )
