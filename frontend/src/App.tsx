import { useState } from "react";
import { Cpu, LayoutDashboard, ScanLine } from "lucide-react";
import IntakeView from "./components/IntakeView";
import ComplianceDashboard from "./components/ComplianceDashboard";

type View = "intake" | "dashboard";

export default function App() {
  const [view, setView] = useState<View>("intake");

  return (
    <div className="min-h-full bg-paper bg-grid">
      {/* Radial glow at the top */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-radial-glow" />
      <TopNav view={view} onChange={setView} />
      <div className="relative z-0">
        {view === "intake" ? <IntakeView /> : <ComplianceDashboard />}
      </div>
    </div>
  );
}

function TopNav({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <nav className="sticky top-0 z-20 border-b border-line glass">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-3">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 border border-accent/30">
            <Cpu className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          </div>
          <span className="font-mono text-sm font-semibold tracking-tight text-ink">
            Agentic<span className="text-accent">Audit</span>
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-line" />

        {/* Tabs */}
        <div className="flex items-center gap-1">
          <Tab
            active={view === "intake"}
            onClick={() => onChange("intake")}
            icon={<ScanLine className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Analysis"
          />
          <Tab
            active={view === "dashboard"}
            onClick={() => onChange("dashboard")}
            icon={<LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Monitor"
          />
        </div>

        {/* Status dot */}
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">Live</span>
        </div>
      </div>
    </nav>
  );
}

function Tab({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
        "focus:outline-none focus:ring-1 focus:ring-accent/50",
        active
          ? "bg-accent/15 text-accent border border-accent/25"
          : "text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
