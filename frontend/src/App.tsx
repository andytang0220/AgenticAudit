import { useState } from "react";
import { FileUp, ShieldAlert } from "lucide-react";
import IntakeView from "./components/IntakeView";
import ComplianceDashboard from "./components/ComplianceDashboard";
import { USE_MOCK } from "./api";

type View = "intake" | "dashboard";

export default function App() {
  // Lightweight in-app switch between the two frontend surfaces — no router
  // dependency for a two-view product.
  const [view, setView] = useState<View>("intake");

  return (
    <div className="min-h-full bg-paper bg-grain">
      <TopNav view={view} onChange={setView} />
      {view === "intake" ? <IntakeView /> : <ComplianceDashboard />}
    </div>
  );
}

function TopNav({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  return (
    <nav className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-6 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          AgenticAudit
        </span>

        <div className="ml-auto flex items-center gap-1">
          <Tab
            active={view === "intake"}
            onClick={() => onChange("intake")}
            icon={<FileUp className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Intake"
          />
          <Tab
            active={view === "dashboard"}
            onClick={() => onChange("dashboard")}
            icon={<ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Monitor"
          />
        </div>

        {USE_MOCK && (
          <span className="rounded-sm border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            mock
          </span>
        )}
      </div>
    </nav>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors",
        "focus:outline-none focus:ring-1 focus:ring-accent",
        active
          ? "bg-[var(--accent-soft)] text-accent"
          : "text-ink-muted hover:text-ink",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
