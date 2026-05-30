import { useCallback, useRef, useState } from "react";
import { FilePlus2, UploadCloud } from "lucide-react";
import { ACCEPT_ATTR } from "../lib/intake";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * A bordered, slightly inset panel — a place to set papers down. Handles
 * drag-and-drop and click-to-browse. Validation happens upstream; this only
 * surfaces raw File objects.
 */
export default function Dropzone({ onFiles, disabled }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // Tracks nested dragenter/dragleave so child elements don't flicker state.
  const dragDepth = useRef(0);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [disabled, onFiles]
  );

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        if (disabled) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setDragging(false);
      }}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-disabled={disabled}
      className={[
        "group relative flex cursor-pointer flex-col items-center justify-center",
        "rounded-lg px-8 py-10 text-center transition-all duration-200",
        "border border-dashed",
        dragging
          ? "border-accent bg-accent/10 scale-[1.01]"
          : "border-line bg-paper-raised hover:border-accent/40 hover:bg-paper-card",
        disabled ? "pointer-events-none opacity-50" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          // Reset so re-selecting the same file still fires onChange.
          e.target.value = "";
        }}
      />

      <div
        className={[
          "mb-4 flex h-12 w-12 items-center justify-center rounded-full border transition-all",
          dragging
            ? "border-accent bg-accent/15 text-accent scale-110"
            : "border-line bg-paper-card text-ink-muted group-hover:border-accent/40 group-hover:text-accent",
        ].join(" ")}
      >
        {dragging ? (
          <FilePlus2 className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <UploadCloud className="h-5 w-5" strokeWidth={1.5} />
        )}
      </div>

      <p className="text-sm font-semibold text-ink">
        {dragging ? "Release to add documents" : "Drop files here"}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        or{" "}
        <span className="text-accent underline underline-offset-4">
          browse to upload
        </span>
      </p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-muted/50">
        PDF · TXT · MD — 10 MB max
      </p>
    </div>
  );
}
