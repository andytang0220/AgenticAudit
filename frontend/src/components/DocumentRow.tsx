import { FileText, FileType2, X } from "lucide-react";
import type { DocType, PendingDocument } from "../types";
import { formatBytes, iconKindFor } from "../lib/intake";
import DocTypeSelect from "./DocTypeSelect";

interface DocumentRowProps {
  doc: PendingDocument;
  suffix?: string; // disambiguation marker for duplicate names
  disabled?: boolean;
  onChangeType: (id: string, next: DocType) => void;
  onRemove: (id: string) => void;
}

function DocIcon({ doc }: { doc: PendingDocument }) {
  const kind = iconKindFor(doc);
  const common = { className: "h-4 w-4", strokeWidth: 1.5 } as const;
  if (kind === "docx") return <FileType2 {...common} />;
  return <FileText {...common} />;
}

export default function DocumentRow({
  doc,
  suffix,
  disabled,
  onChangeType,
  onRemove,
}: DocumentRowProps) {
  const sizeLabel = formatBytes(doc.size_bytes);

  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      {/* Type icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink-muted">
        <DocIcon doc={doc} />
      </div>

      {/* Name + metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
          {suffix && (
            <span className="shrink-0 font-mono text-[11px] text-ink-muted">
              {suffix}
            </span>
          )}
        </div>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          {sizeLabel}
        </p>
      </div>

      {/* Doc-type selector */}
      <DocTypeSelect
        value={doc.doc_type}
        disabled={disabled}
        onChange={(next) => onChangeType(doc.local_id, next)}
      />

      {/* Remove */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRemove(doc.local_id)}
        aria-label={`Remove ${doc.name}`}
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm",
          "text-ink-muted transition-colors",
          "hover:bg-[var(--danger-soft)] hover:text-danger",
          "focus:outline-none focus:ring-1 focus:ring-danger",
          "disabled:pointer-events-none disabled:opacity-40",
        ].join(" ")}
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
