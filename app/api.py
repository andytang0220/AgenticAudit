"""
FastAPI app — RAG-powered agent endpoint.
Run: uvicorn app.api:app --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.agent import run_rag_agent, AgentResponse
from vector_database import populate


@asynccontextmanager
async def lifespan(app: FastAPI):
    # populate()
    yield

app = FastAPI(
    title="AgenticAudit RAG API",
    description="Query a knowledge base using ChromaDB + DeepSeek",
    version="1.0.0",
    lifespan=lifespan,
)


# ── Request schema ─────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str
    n_docs: int = 3


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "AgenticAudit RAG API is running."}


@app.post("/agent/query", response_model=AgentResponse)
async def agent_query(request: QueryRequest):
    """
    Main RAG endpoint:
    1. Searches ChromaDB for relevant documents
    2. Passes them to DeepSeek via pydantic-ai agent
    3. Returns grounded answer + source snippets
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    response = await run_rag_agent(request.query, n_docs=request.n_docs)
    return response

