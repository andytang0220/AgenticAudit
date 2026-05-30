import { ExternalLink, Clock, Globe } from "lucide-react";
import type { ComplianceAlert } from "../types";
import { formatDetectedAt, severityStyle } from "../lib/alerts";

interface AlertCardProps {
  alert: ComplianceAlert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const sev = severityStyle(alert.severity_level);
  const score = Math.max(0, Math.min(100, alert.risk_severity_score));

  return (
    <article className="rounded-sm border border-line bg-paper-raised">
      {/* Header: severity + risk meter + timestamp */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3">
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-sm border border-line px-2 py-0.5",
            "font-mono text-[11px] uppercase tracking-wider",
            sev.fg,
            sev.bg,
          ].join(" ")}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${sev.bar}`} />
          {sev.label}
        </span>

        {/* Risk meter */}
        <div className="flex min-w-[160px] flex-1 items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full ${sev.bar}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className={`font-mono text-xs ${sev.fg}`}>
            {score.toFixed(0)}
            <span className="text-ink-muted">/100</span>
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
          <Clock className="h-3 w-3" strokeWidth={1.75} />
          {formatDetectedAt(alert.detected_at)}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <h3 className="font-display text-lg leading-snug text-ink">
          {alert.summary_of_changes}
        </h3>

        <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
          <Globe className="h-3 w-3" strokeWidth={1.75} />
          {alert.source_domain}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {alert.detailed_findings}
        </p>

        {/* Frameworks */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {alert.affected_compliance_framework.map((fw) => (
            <span
              key={fw}
              className="rounded-sm border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-ink-muted"
            >
              {fw}
            </span>
          ))}
        </div>

        {/* Recommended action */}
        <div className="mt-4 border-l-2 border-accent/50 pl-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Recommended action
          </p>
          <p className="mt-0.5 text-sm text-ink">{alert.recommended_action}</p>
        </div>
      </div>

      {/* Footer: evidence link */}
      <div className="flex items-center justify-between border-t border-line px-5 py-2.5">
        <span className="font-mono text-[11px] text-ink-muted">
          {alert.alert_id}
        </span>
        <a
          href={alert.bright_data_evidence_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-accent underline decoration-line underline-offset-4 transition-colors hover:decoration-accent"
        >
          View evidence
          <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
        </a>
      </div>
    </article>
  );
}
