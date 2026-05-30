import { ChevronDown } from "lucide-react";
import { DOC_TYPE_LABELS, DOC_TYPE_ORDER, type DocType } from "../types";

interface DocTypeSelectProps {
  value: DocType;
  onChange: (next: DocType) => void;
  disabled?: boolean;
}

/** Native <select> restyled to the dossier aesthetic — monospaced value. */
export default function DocTypeSelect({
  value,
  onChange,
  disabled,
}: DocTypeSelectProps) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as DocType)}
        aria-label="Document type"
        className={[
          "appearance-none rounded-sm border border-line bg-paper",
          "py-1.5 pl-2.5 pr-7 font-mono text-xs text-ink",
          "transition-colors hover:border-ink-muted/50",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
          "disabled:opacity-50",
        ].join(" ")}
      >
        {DOC_TYPE_ORDER.map((t) => (
          <option key={t} value={t}>
            {DOC_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-ink-muted"
        strokeWidth={1.75}
      />
    </div>
  );
}
