import type { PendingDocument } from "../types";

// ── File acceptance rules ───────────────────────────────────────────

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// Accepted extensions + matching MIME types. We check both because the
// `accept` attribute is a hint, not validation.
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

/** Comma-joined string for an <input accept="..."> attribute. */
export const ACCEPT_ATTR = [
  ...ACCEPTED_EXTENSIONS,
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
].join(",");

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export interface FileRejection {
  name: string;
  reason: string;
}

export interface FileValidationResult {
  accepted: PendingDocument[];
  rejected: FileRejection[];
}

/** Validate a batch of dropped/selected files into pending docs + rejections. */
export function validateFiles(files: File[]): FileValidationResult {
  const accepted: PendingDocument[] = [];
  const rejected: FileRejection[] = [];

  for (const file of files) {
    const extOk = hasAcceptedExtension(file.name);
    // Some browsers leave type blank for .docx; fall back to extension.
    const mimeOk = file.type === "" || ACCEPTED_MIME.has(file.type);

    if (!extOk || !mimeOk) {
      rejected.push({
        name: file.name,
        reason: "Unsupported type — only PDF, DOCX, or TXT are accepted.",
      });
      continue;
    }

    if (file.size > MAX_FILE_BYTES) {
      rejected.push({
        name: file.name,
        reason: `Too large (${formatBytes(file.size)}) — 10 MB maximum.`,
      });
      continue;
    }

    if (file.size === 0) {
      rejected.push({
        name: file.name,
        reason: "File is empty.",
      });
      continue;
    }

    accepted.push(fileToPending(file));
  }

  return { accepted, rejected };
}

function fileToPending(file: File): PendingDocument {
  return {
    local_id: crypto.randomUUID(),
    name: file.name,
    file,
    size_bytes: file.size,
    doc_type: "other",
  };
}

// ── Formatting ──────────────────────────────────────────────────────

/** Human-readable byte size: 870 B, 12.4 KB, 3.1 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

// ── Duplicate-name disambiguation ───────────────────────────────────

/**
 * Returns a map of local_id -> display suffix (e.g. "(2)") for docs whose
 * name collides with another. Duplicates are allowed; we just disambiguate
 * them visually so the user can tell rows apart.
 */
export function duplicateSuffixes(
  docs: PendingDocument[]
): Record<string, string> {
  const counts = new Map<string, number>();
  for (const d of docs) {
    counts.set(d.name, (counts.get(d.name) ?? 0) + 1);
  }

  const seen = new Map<string, number>();
  const suffixes: Record<string, string> = {};
  for (const d of docs) {
    if ((counts.get(d.name) ?? 0) > 1) {
      const n = (seen.get(d.name) ?? 0) + 1;
      seen.set(d.name, n);
      suffixes[d.local_id] = `(${n})`;
    }
  }
  return suffixes;
}

/** lucide icon key per file extension — resolved in the row component. */
export type DocIconKind = "pdf" | "docx" | "txt";

export function iconKindFor(doc: PendingDocument): DocIconKind {
  const lower = doc.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "txt";
}
