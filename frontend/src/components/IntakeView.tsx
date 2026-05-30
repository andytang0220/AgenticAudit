import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Loader2, ScanLine } from "lucide-react";
import type { DocType, IntakeResult, PendingDocument } from "../types";
import { submitIntake } from "../api";
import {
  duplicateSuffixes,
  validateFiles,
  type FileRejection,
} from "../lib/intake";
import Dropzone from "./Dropzone";
import DocumentRow from "./DocumentRow";
import SubmittedView from "./SubmittedView";

type Phase = "editing" | "submitting" | "submitted";

export default function IntakeView() {
  const [phase, setPhase] = useState<Phase>("editing");
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const busy = phase === "submitting";
  const suffixes = useMemo(() => duplicateSuffixes(docs), [docs]);
  const canSubmit = docs.length > 0 && !busy;

  // ── doc mutations ──────────────────────────────────────────────────
  const addFiles = useCallback((files: File[]) => {
    const { accepted, rejected } = validateFiles(files);
    if (accepted.length) setDocs((prev) => [...prev, ...accepted]);
    // Replace rejections with this batch's so messages stay relevant.
    setRejections(rejected);
  }, []);

  const removeDoc = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.local_id !== id));
  }, []);

  const changeType = useCallback((id: string, next: DocType) => {
    setDocs((prev) =>
      prev.map((d) => (d.local_id === id ? { ...d, doc_type: next } : d))
    );
  }, []);

  // ── submit flow ────────────────────────────────────────────────────
  async function runAnalysis() {
    if (!canSubmit) return;
    setPhase("submitting");
    setSubmitError(null);
    try {
      const res = await submitIntake(docs);
      setResult(res);
      setPhase("submitted");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Submission failed. Try again."
      );
      setPhase("editing");
    }
  }

  function reset() {
    setDocs([]);
    setRejections([]);
    setResult(null);
    setSubmitError(null);
    setPhase("editing");
  }

  // ── submitted terminus ─────────────────────────────────────────────
  if (phase === "submitted" && result) {
    return (
      <Shell>
        <SubmittedView result={result} onReset={reset} />
      </Shell>
    );
  }

  // ── editing / submitting ───────────────────────────────────────────
  return (
    <Shell>
      <Header />

      {/* Dropzone */}
      <section className="reveal reveal-d2 mt-10">
        <Dropzone onFiles={addFiles} disabled={busy} />

        {docs.length > 0 && (
          <div className="mt-3 flex items-center justify-end">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              {docs.length} document{docs.length === 1 ? "" : "s"} staged
            </span>
          </div>
        )}

        {/* Rejected files */}
        {rejections.length > 0 && (
          <div className="mt-3 rounded-sm border border-danger/40 bg-[var(--danger-soft)] px-4 py-3">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-sm font-medium">
                {rejections.length} file
                {rejections.length === 1 ? "" : "s"} couldn’t be added
              </span>
            </div>
            <ul className="mt-2 space-y-1 pl-6">
              {rejections.map((r, i) => (
                <li key={`${r.name}-${i}`} className="text-xs text-ink-muted">
                  <span className="font-mono text-ink">{r.name}</span> —{" "}
                  {r.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Document list */}
      {docs.length > 0 && (
        <section className="reveal reveal-d3 mt-8">
          <SectionLabel>Staged documents</SectionLabel>
          <div className="divide-y divide-line overflow-hidden rounded-sm border border-line bg-paper-raised">
            {docs.map((doc) => (
              <DocumentRow
                key={doc.local_id}
                doc={doc}
                suffix={suffixes[doc.local_id]}
                disabled={busy}
                onChangeType={changeType}
                onRemove={removeDoc}
              />
            ))}
          </div>
        </section>
      )}

      {/* Submit */}
      <section className="reveal reveal-d4 mt-10 border-t border-line pt-6">
        {submitError && (
          <div className="mb-4 flex items-center gap-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
            {submitError}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-muted">
            {docs.length === 0
              ? "Add at least one document to begin."
              : `Ready to analyze ${docs.length} document${
                  docs.length === 1 ? "" : "s"
                }.`}
          </p>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={runAnalysis}
            className={[
              "inline-flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold",
              "transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper",
              canSubmit
                ? "bg-accent text-paper hover:opacity-90"
                : "cursor-not-allowed border border-line bg-paper text-ink-muted/60",
            ].join(" ")}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Submitting…
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4" strokeWidth={1.75} />
                Run analysis
              </>
            )}
          </button>
        </div>
      </section>
    </Shell>
  );
}

// ── layout + small presentational helpers ────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      {children}
    </main>
  );
}

function Header() {
  return (
    <header className="reveal reveal-d1">
      <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
        Document intake
      </h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
        Upload the documents you want reviewed for compliance, tag what each one
        is, and hand them off for analysis.
      </p>
    </header>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
      {children}
    </h2>
  );
}
