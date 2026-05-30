import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Globe, Loader2,
  ScanLine, BookOpen, Zap, RotateCcw, Database, Wifi,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { AgentQueryResponse, DocType, IntakeResult, PendingDocument } from "../types";
import { runAgentQuery, submitIntake } from "../api";
import { duplicateSuffixes, validateFiles, type FileRejection } from "../lib/intake";
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
  const canSubmit = query.trim().length > 0 && !agentLoading;

  const addFiles = useCallback((files: File[]) => {
    const { accepted, rejected } = validateFiles(files);
    if (accepted.length) setDocs((prev) => [...prev, ...accepted]);
    setRejections(rejected);
  }, []);

  const removeDoc = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.local_id !== id));
  }, []);

  const changeType = useCallback((id: string, next: DocType) => {
    setDocs((prev) => prev.map((d) => (d.local_id === id ? { ...d, doc_type: next } : d)));
  }, []);

  async function runAnalysis() {
    if (!canSubmit) return;
    setAgentLoading(true);
    setAgentResponse(null);
    setSubmitError(null);
    try {
      const res = await runAgentQuery(query.trim());
      setAgentResponse(res);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Analysis failed. Try again.");
    } finally {
      setAgentLoading(false);
    }
  }

  function reset() {
    setDocs([]); setQuery(""); setRejections([]);
    setResult(null); setSubmitError(null);
    setAgentResponse(null); setPhase("editing");
  }

  if (phase === "submitted" && result) {
    return <Shell><SubmittedView result={result} onReset={reset} /></Shell>;
  }

  return (
    <Shell>

      {/* ── Hero header ──────────────────────────────────────────── */}
      <header className="reveal reveal-d1 text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-6">
          <Zap className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          <span className="font-mono text-xs text-accent tracking-wider">Two-step AI agent · RAG + Web</span>
        </div>
        <h1 className="text-4xl font-bold text-ink sm:text-5xl mb-4 leading-tight">
          Compliance <span className="text-accent">Intelligence</span>
        </h1>
        <p className="text-ink-muted text-base max-w-lg mx-auto leading-relaxed">
          Ask any compliance question. The agent searches your internal policy knowledge base
          and live web data in parallel — then synthesises a grounded answer.
        </p>

        {/* Pipeline steps */}
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          {[
            { icon: <Database className="h-3.5 w-3.5" />, label: "Policy DB" },
            { icon: <span className="text-[10px] font-bold">+</span>, label: null },
            { icon: <Wifi className="h-3.5 w-3.5" />, label: "Web Intel" },
            { icon: <span className="text-[10px] font-bold">→</span>, label: null },
            { icon: <Zap className="h-3.5 w-3.5" />, label: "DeepSeek AI" },
          ].map((step, i) =>
            step.label ? (
              <div key={i} className="flex items-center gap-1.5 rounded-md border border-line bg-paper-raised px-3 py-1.5">
                <span className="text-accent">{step.icon}</span>
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">{step.label}</span>
              </div>
            ) : (
              <span key={i} className="text-ink-muted font-bold">{step.icon}</span>
            )
          )}
        </div>
      </header>

      {/* ── Query input ───────────────────────────────────────────── */}
      <section className="reveal reveal-d2">
        <Label>Your compliance question</Label>
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runAnalysis(); }}
            disabled={agentLoading}
            rows={4}
            placeholder="e.g. What are the insurance requirements for our vendors? Do we comply with CCPA social media privacy rules in California?"
            className={[
              "w-full resize-y rounded-lg border bg-paper-raised px-4 py-3.5 text-sm leading-relaxed text-ink",
              "placeholder:text-ink-muted/40 focus:outline-none transition-all duration-200",
              agentLoading
                ? "border-line opacity-60 cursor-not-allowed"
                : "border-line hover:border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:bg-paper-card",
            ].join(" ")}
          />
          {query.trim().length > 0 && !agentLoading && (
            <span className="absolute bottom-3 right-3 font-mono text-[10px] text-ink-muted/40 select-none">
              ⌘↵ to run
            </span>
          )}
        </div>
      </section>

      {/* ── Optional docs ─────────────────────────────────────────── */}
      <section className="reveal reveal-d3 mt-6">
        <Label>Upload documents <span className="text-ink-muted font-normal normal-case">(optional)</span></Label>
        <Dropzone onFiles={addFiles} disabled={busy} />
        {docs.length > 0 && (
          <div className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper-raised">
            {docs.map((doc) => (
              <DocumentRow key={doc.local_id} doc={doc} suffix={suffixes[doc.local_id]}
                disabled={busy} onChangeType={changeType} onRemove={removeDoc} />
            ))}
          </div>
        )}
        {rejections.length > 0 && (
          <div className="mt-3 rounded-lg border border-danger/30 bg-[var(--danger-soft)] px-4 py-3 animate-slide-in-right flex items-center gap-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {rejections.length} file{rejections.length === 1 ? "" : "s"} couldn't be added
          </div>
        )}
      </section>

      {/* ── Submit ────────────────────────────────────────────────── */}
      <section className="reveal reveal-d4 mt-8">
        {submitError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-danger/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-danger animate-slide-in-right">
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {submitError}
          </div>
        )}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={runAnalysis}
          className={[
            "btn-accent w-full rounded-lg py-3.5 text-sm font-semibold flex items-center justify-center gap-3",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-paper",
            canSubmit
              ? "bg-accent text-white shadow-lg shadow-accent/20"
              : "cursor-not-allowed bg-paper-raised border border-line text-ink-muted/50",
          ].join(" ")}
        >
          {agentLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              <span>Agent is analysing</span>
              <span className="flex gap-1 ml-1">
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
              </span>
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4" strokeWidth={1.75} />
              Run Analysis
            </>
          )}
        </button>
        {!canSubmit && !agentLoading && (
          <p className="text-center text-xs text-ink-muted mt-2">Enter a question above to begin</p>
        )}
      </section>

      {/* ── Loading skeleton ──────────────────────────────────────── */}
      {agentLoading && (
        <section className="mt-10 space-y-4">
          <div className="rounded-lg border border-accent/20 bg-paper-raised p-5 animate-border-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full shimmer" />
              <div className="h-3 w-48 shimmer" />
            </div>
            <div className="space-y-2.5">
              <div className="h-3 w-full shimmer" />
              <div className="h-3 w-5/6 shimmer" />
              <div className="h-3 w-4/6 shimmer" />
              <div className="h-3 w-5/6 shimmer" />
              <div className="h-3 w-3/5 shimmer" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-7 w-36 shimmer rounded-full" />
            <div className="h-7 w-28 shimmer rounded-full" />
          </div>
        </section>
      )}

      {/* ── Agent response ────────────────────────────────────────── */}
      {agentResponse && !agentLoading && (
        <section className="animate-result-in mt-10 space-y-4">

          {/* Success header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 border border-success/30 animate-glow-pulse" style={{"--accent-glow": "rgba(63,185,80,0.3)"} as React.CSSProperties}>
                <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Analysis complete</p>
                <p className="text-xs text-ink-muted">Both sources processed successfully</p>
              </div>
            </div>
            {/* Badges */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-raised px-2.5 py-1 font-mono text-[10px] text-ink-muted">
                <Database className="h-3 w-3 text-accent" />
                Policy DB
              </span>
              <span className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px]",
                agentResponse.web_results_used
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-line bg-paper-raised text-ink-muted/60",
              ].join(" ")}>
                <Globe className="h-3 w-3" />
                {agentResponse.web_results_used ? "Web: live" : "Web: off"}
              </span>
            </div>
          </div>

          {/* Answer card */}
          <div className="rounded-lg border-neon bg-paper-raised overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line px-5 py-3 bg-accent/5">
              <Zap className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                AI Analysis
              </span>
              <div className="ml-auto flex gap-1">
                <div className="h-2 w-2 rounded-full bg-danger/60" />
                <div className="h-2 w-2 rounded-full bg-warning/60" />
                <div className="h-2 w-2 rounded-full bg-success/60" />
              </div>
            </div>
            <div className="px-5 py-6 markdown-body">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-bold text-ink mb-3 mt-5 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold text-ink mb-2 mt-4 first:mt-0 pb-1 border-b border-line">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-ink mb-2 mt-3">{children}</h3>,
                  p:  ({ children }) => <p  className="text-sm leading-7 text-ink mb-3 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="text-sm text-ink mb-3 space-y-1 pl-4 list-disc marker:text-accent">{children}</ul>,
                  ol: ({ children }) => <ol className="text-sm text-ink mb-3 space-y-1 pl-4 list-decimal marker:text-accent">{children}</ol>,
                  li: ({ children }) => <li className="leading-6">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-accent">{children}</strong>,
                  em:     ({ children }) => <em className="italic text-ink-muted">{children}</em>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    return isBlock
                      ? <code className="block bg-paper text-accent font-mono text-xs p-3 rounded-md border border-line my-3 overflow-x-auto whitespace-pre">{children}</code>
                      : <code className="bg-paper text-accent font-mono text-xs px-1.5 py-0.5 rounded border border-line">{children}</code>;
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-accent/50 pl-4 my-3 text-ink-muted italic">{children}</blockquote>
                  ),
                  hr: () => <hr className="border-line my-4" />,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">{children}</a>
                  ),
                }}
              >
                {agentResponse.answer}
              </ReactMarkdown>
            </div>
          </div>

          {/* Sources */}
          {agentResponse.internal_sources.length > 0 && (
            <div className="rounded-lg border border-line bg-paper-raised p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Retrieved from knowledge base
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {agentResponse.internal_sources.map((src, i) => (
                  <span key={i}
                    className="inline-flex items-center gap-1.5 rounded-md border border-accent/20 bg-accent/5 px-2.5 py-1 font-mono text-[10px] text-accent/80"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                    {src}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* New analysis */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={reset}
              className="btn-accent inline-flex items-center gap-2 rounded-lg border border-line bg-paper-raised px-5 py-2.5 text-sm text-ink-muted hover:border-accent/40 hover:text-accent transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
              New analysis
            </button>
          </div>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-16">
      {children}
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
      {children}
    </label>
  );
}
