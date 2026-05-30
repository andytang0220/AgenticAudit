import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Globe, Loader2, ScanLine } from "lucide-react";
import type { AgentQueryResponse, DocType, IntakeResult, PendingDocument } from "../types";
import { runAgentQuery, submitIntake } from "../api";
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
  const [query, setQuery] = useState("");
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agentResponse, setAgentResponse] = useState<AgentQueryResponse | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  const busy = phase === "submitting";
  const suffixes = useMemo(() => duplicateSuffixes(docs), [docs]);
  const canSubmit = query.trim().length > 0 && !busy;

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
    setAgentLoading(true);
    setAgentResponse(null);
    setSubmitError(null);
    try {
      const trimmed = query.trim();
      const res = await runAgentQuery(trimmed);
      setAgentResponse(res);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Analysis failed. Try again."
      );
    } finally {
      setAgentLoading(false);
    }
  }

  function reset() {
    setDocs([]);
    setQuery("");
    setRejections([]);
    setResult(null);
    setSubmitError(null);
    setAgentResponse(null);
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

      {/* Analysis query (optional free-text instruction) */}
      <section className="reveal reveal-d3 mt-8">
        <SectionLabel>Analysis query</SectionLabel>
        <p className="mb-3 -mt-1 text-sm text-ink-muted">
          Optionally describe what to focus on — a question or instruction to
          guide the review (e.g. “Check these against GDPR data-retention
          rules”).
        </p>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={busy}
          rows={3}
          placeholder="What should the analysis focus on? (optional)"
          className="w-full resize-y rounded-sm border border-line bg-paper-raised px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
        />
      </section>

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
            {query.trim().length === 0
              ? "Enter a query to begin analysis."
              : "Ready to run analysis."}
          </p>
          <button
            type="button"
            disabled={!canSubmit || agentLoading}
            onClick={runAnalysis}
            className={[
              "inline-flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold",
              "transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper",
              canSubmit && !agentLoading
                ? "bg-accent text-paper hover:opacity-90"
                : "cursor-not-allowed border border-line bg-paper text-ink-muted/60",
            ].join(" ")}
          >
            {agentLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Analysing…
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

      {/* Agent response */}
      {agentResponse && (
        <section className="reveal mt-10 border-t border-line pt-6">
          <SectionLabel>Analysis result</SectionLabel>

          {/* Answer */}
          <div className="rounded-sm border border-line bg-paper-raised px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {agentResponse.answer}
            </p>
          </div>

          {/* Sources */}
          {agentResponse.internal_sources.length > 0 && (
            <div className="mt-4">
              <SectionLabel>Internal sources</SectionLabel>
              <ul className="space-y-1">
                {agentResponse.internal_sources.map((src, i) => (
                  <li key={i} className="font-mono text-[11px] text-ink-muted">
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Web results badge */}
          <div className="mt-4 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
            <span className="font-mono text-[11px] text-ink-muted">
              Web intelligence:{" "}
              <span className={agentResponse.web_results_used ? "text-accent" : "text-danger"}>
                {agentResponse.web_results_used ? "used" : "unavailable"}
              </span>
            </span>
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-sm border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
            New analysis
          </button>
        </section>
      )}
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
