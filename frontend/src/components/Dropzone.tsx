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
        "rounded-sm px-8 py-14 text-center transition-colors duration-200",
        "border border-dashed",
        // Inset paper feel: raised fill against a hairline dashed frame.
        dragging
          ? "border-accent bg-[var(--accent-soft)]"
          : "border-line bg-paper-raised hover:border-ink-muted/40",
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
          "mb-4 flex h-12 w-12 items-center justify-center rounded-full border transition-colors",
          dragging
            ? "border-accent text-accent"
            : "border-line text-ink-muted group-hover:text-ink",
        ].join(" ")}
      >
        {dragging ? (
          <FilePlus2 className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <UploadCloud className="h-5 w-5" strokeWidth={1.5} />
        )}
      </div>

      <p className="font-display text-lg text-ink">
        {dragging ? "Release to add documents" : "Set your documents here"}
      </p>
      <p className="mt-1.5 text-sm text-ink-muted">
        Drag &amp; drop, or{" "}
        <span className="text-accent underline decoration-line underline-offset-4">
          browse to upload
        </span>
      </p>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-ink-muted/70">
        PDF · DOCX · TXT — 10 MB max each
      </p>
    </div>
  );
}
