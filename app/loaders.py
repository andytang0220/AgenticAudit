"""Text extraction + chunking for uploaded documents."""

import io
import os

from fastapi import HTTPException

ALLOWED_EXTENSIONS = {".txt", ".md", ".markdown", ".pdf"}
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200


def extension_of(filename: str) -> str:
    return os.path.splitext(filename or "")[1].lower()


def extract_text(filename: str, raw: bytes) -> str:
    """Extract plain text from an uploaded file's raw bytes.

    Supports .txt/.md/.markdown (decoded as text) and .pdf (via pypdf).
    Raises HTTP 415 for unsupported extensions, 422 if no text is found.
    """
    ext = extension_of(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext or '?'}'. "
            f"Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    if ext == ".pdf":
        text = _extract_pdf(raw)
    else:
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text = raw.decode("latin-1", errors="replace")

    text = text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="No extractable text in file.")
    return text


def _extract_pdf(raw: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:  # pragma: no cover
        raise HTTPException(
            status_code=500, detail="pypdf is not installed; cannot read PDF files."
        )
    reader = PdfReader(io.BytesIO(raw))
    return "\n\n".join((page.extract_text() or "") for page in reader.pages)


def chunk(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping character chunks. Small text → one chunk."""
    text = text.strip()
    if len(text) <= size:
        return [text]

    step = max(1, size - overlap)
    chunks = []
    for start in range(0, len(text), step):
        piece = text[start : start + size].strip()
        if piece:
            chunks.append(piece)
        if start + size >= len(text):
            break
    return chunks
