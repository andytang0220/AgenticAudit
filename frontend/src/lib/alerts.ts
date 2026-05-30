import type { SeverityLevel } from "../types";

// Severity color-coding per INTEGRATION.md UI guidance — red for
// CRITICAL/HIGH, amber for MEDIUM, gray for LOW/INFO — expressed through the
// dossier palette (danger / accent / ink-muted) so it stays on-aesthetic.
export interface SeverityStyle {
  label: string;
  /** text/border color */
  fg: string;
  /** soft fill */
  bg: string;
  /** solid bar fill for the risk meter */
  bar: string;
}

export function severityStyle(level: SeverityLevel): SeverityStyle {
  switch (level) {
    case "CRITICAL":
      return {
        label: "Critical",
        fg: "text-danger",
        bg: "bg-[var(--danger-soft)]",
        bar: "bg-danger",
      };
    case "HIGH":
      return {
        label: "High",
        fg: "text-danger",
        bg: "bg-[var(--danger-soft)]",
        bar: "bg-danger",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        fg: "text-accent",
        bg: "bg-[var(--accent-soft)]",
        bar: "bg-accent",
      };
    case "LOW":
      return {
        label: "Low",
        fg: "text-ink-muted",
        bg: "bg-paper",
        bar: "bg-ink-muted",
      };
    case "INFO":
    default:
      return {
        label: "Info",
        fg: "text-ink-muted",
        bg: "bg-paper",
        bar: "bg-ink-muted",
      };
  }
}

/** Format an ISO 8601 timestamp as e.g. "30 May 2026 · 10:30". */
export function formatDetectedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}
