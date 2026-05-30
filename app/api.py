"""
FastAPI app — RAG-powered agent endpoint.
Run: uvicorn app.api:app --reload
"""

from __future__ import annotations

import uuid
from collections import OrderedDict
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agent import run_rag_agent, AgentResponse
from app.loaders import chunk, extract_text
from connectors import vector_connector as vc

# Uploaded documents go in their own collection so they don't clobber the
# "default" corpus that populate() seeds on startup.
DOCUMENTS_COLLECTION = "documents"
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str
    n_docs: int = 3


class UploadResponse(BaseModel):
    doc_id: str
    name: str
    content_type: str
    num_chunks: int
    size: int


class DocumentOut(BaseModel):
    doc_id: str
    name: str
    content_type: str
    num_chunks: int
    size: int


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


# ── Document upload ──────────────────────────────────────────────────────────
@app.post("/documents", response_model=UploadResponse, status_code=201)
async def upload_document(
    file: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None),
    name: Optional[str] = Form(default=None),
):
    """Upload a document by file OR raw text; chunk it and store in the vector DB."""
    if file is not None:
        raw = await file.read()
        if len(raw) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File too large.")
        doc_name = name or file.filename or "untitled"
        body = extract_text(file.filename or doc_name, raw)
        content_type = (file.filename or "").rsplit(".", 1)[-1].lower() or "txt"
        size = len(raw)
    elif text and text.strip():
        body = text.strip()
        if len(body.encode("utf-8")) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Text too large.")
        doc_name = name or "untitled"
        content_type = "text"
        size = len(body.encode("utf-8"))
    else:
        raise HTTPException(
            status_code=400, detail="Provide a 'file' upload or a 'text' field."
        )

    doc_id = uuid.uuid4().hex
    pieces = chunk(body)
    ids = [f"{doc_id}:{i}" for i in range(len(pieces))]
    metadatas = [
        {
            "doc_id": doc_id,
            "name": doc_name,
            "content_type": content_type,
            "size": size,
            "chunk": i,
        }
        for i in range(len(pieces))
    ]
    vc.add(pieces, ids=ids, metadatas=metadatas, collection=DOCUMENTS_COLLECTION)

    return UploadResponse(
        doc_id=doc_id,
        name=doc_name,
        content_type=content_type,
        num_chunks=len(pieces),
        size=size,
    )


@app.get("/documents", response_model=list[DocumentOut])
def list_documents():
    """List uploaded documents (deduped by doc_id from chunk metadata)."""
    grouped: "OrderedDict[str, list[dict]]" = OrderedDict()
    for row in vc.list_chunks(DOCUMENTS_COLLECTION):
        meta = row.get("metadata") or {}
        doc_id = meta.get("doc_id", row["id"])
        grouped.setdefault(doc_id, []).append(row)

    out = []
    for doc_id, rows in grouped.items():
        meta = rows[0].get("metadata") or {}
        out.append(
            DocumentOut(
                doc_id=doc_id,
                name=meta.get("name", doc_id),
                content_type=meta.get("content_type", "text"),
                num_chunks=len(rows),
                size=int(meta.get("size", sum(len(r["text"]) for r in rows))),
            )
        )
    return out

