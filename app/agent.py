"""
RAG Agent — ChromaDB retrieval + DeepSeek LLM with structured prompts.
"""

from pydantic import BaseModel
from connectors.vector_connector import search
from connectors.deepseek_connector import deepseek_chat


# ── Prompts ────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an intelligent research assistant with access to a curated knowledge base.

Your responsibilities:
- Answer questions accurately using ONLY the provided context documents.
- Be concise, clear, and factual in your responses.
- If the context does not contain enough information to answer, explicitly say: "The knowledge base does not contain sufficient information on this topic."
- Never fabricate facts or use knowledge outside the provided context.
- Cite which document (e.g. Doc 1, Doc 2) your answer is based on."""

USER_PROMPT_TEMPLATE = """## Retrieved Context
{context}

## User Question
{query}

## Instructions
Answer the question based solely on the context above. Reference the relevant document(s) in your answer."""


# ── Response schema ────────────────────────────────────────────────────────────
class AgentResponse(BaseModel):
    answer: str
    sources: list[str]


# ── Agent ──────────────────────────────────────────────────────────────────────
async def run_rag_agent(query: str, n_docs: int = 3) -> AgentResponse:
    """
    RAG pipeline:
    1. Semantic search on ChromaDB
    2. Build structured prompt with retrieved context
    3. Call DeepSeek and return grounded answer
    """
    # Step 1: Retrieve relevant docs
    docs = search(query, n=n_docs)
    if not docs:
        return AgentResponse(
            answer="The knowledge base does not contain sufficient information on this topic.",
            sources=[],
        )

    # Step 2: Format context block
    context = "\n\n".join(
        [f"[Doc {i+1}] (relevance: {d['score']:.2f})\n{d['text']}" for i, d in enumerate(docs)]
    )

    # Step 3: Build full prompt and call DeepSeek
    full_prompt = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(context=context, query=query)}"
    answer = deepseek_chat(full_prompt)

    return AgentResponse(
        answer=answer,
        sources=[f"[Doc {i+1}] {d['text'][:100]}..." for i, d in enumerate(docs)],
    )
