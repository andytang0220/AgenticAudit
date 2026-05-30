import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import type { AlertsResponse } from "../types";
import { fetchComplianceAlerts } from "../api";
import AlertCard from "./AlertCard";

type Status = "loading" | "ready" | "error";

/**
 * Compliance-monitoring dashboard — the frontend's role per INTEGRATION.md.
 * Consumes GET /api/v1/compliance-alerts and renders severity-coded alerts.
 */
export default function ComplianceDashboard() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetchComplianceAlerts();
      setData(res);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <header className="reveal reveal-d1">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              Compliance monitor
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
              Live compliance findings detected across monitored sources, ranked
              by risk.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={status === "loading"}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
            Refresh
          </button>
        </div>

        {/* Summary counts */}
        {data && status === "ready" && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Stat label="Total alerts" value={data.total_count} />
            <Stat
              label="High-risk"
              value={data.high_risk_count}
              emphasis={data.high_risk_count > 0}
            />
          </div>
        )}
      </header>

      <section className="reveal reveal-d2 mt-10">
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState message={error} onRetry={load} />}
        {status === "ready" && data && (
          <>
            {data.alerts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {data.alerts.map((alert) => (
                  <AlertCard key={alert.alert_id} alert={alert} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

// ── pieces ──────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-sm border px-4 py-2.5",
        emphasis
          ? "border-danger/40 bg-[var(--danger-soft)]"
          : "border-line bg-paper-raised",
      ].join(" ")}
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p
        className={[
          "font-mono text-2xl",
          emphasis ? "text-danger" : "text-ink",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-sm border border-dashed border-line bg-paper-raised py-16 text-ink-muted">
      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
      <span className="text-sm">Loading compliance alerts…</span>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-sm border border-danger/40 bg-[var(--danger-soft)] px-5 py-6">
      <div className="flex items-center gap-2 text-danger">
        <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
        <span className="text-sm font-medium">Couldn’t load alerts</span>
      </div>
      {message && <p className="mt-1.5 text-xs text-ink-muted">{message}</p>}
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-sm border border-line bg-paper px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-line bg-paper-raised py-16 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-muted">
        <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <p className="font-display text-lg text-ink">No alerts</p>
      <p className="mt-1 text-sm text-ink-muted">
        Nothing flagged across monitored sources right now.
      </p>
    </div>
  );
}
