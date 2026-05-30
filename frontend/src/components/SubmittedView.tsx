import { CheckCircle2, ArrowRight, FileCheck2 } from "lucide-react";
import { DOC_TYPE_LABELS, type IntakeResult } from "../types";

interface SubmittedViewProps {
  result: IntakeResult;
  onReset: () => void;
}

/**
 * Terminal confirmation for this build: an analysis job has been queued for
 * each submitted document. In the full app this screen routes onward to a
 * running/results dashboard that polls GET /api/v1/jobs/{job_id}.
 */
export default function SubmittedView({ result, onReset }: SubmittedViewProps) {
  const count = result.submitted.length;

  return (
    <div className="reveal">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent text-accent">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="font-display text-2xl text-ink">Analysis underway</h2>
          <p className="text-sm text-ink-muted">
            {count} document{count === 1 ? "" : "s"} queued for compliance
            review. Each is tracked by its own job.
          </p>
        </div>
      </div>

      {/* Queued jobs */}
      <div className="mt-8">
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          Queued jobs · {count}
        </h3>
        <div className="divide-y divide-line overflow-hidden rounded-sm border border-line bg-paper-raised">
          {result.submitted.map((d) => (
            <div key={d.local_id} className="flex items-center gap-4 px-5 py-3.5">
              <FileCheck2
                className="h-4 w-4 shrink-0 text-ink-muted"
                strokeWidth={1.5}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{d.name}</p>
                <p className="mt-0.5 select-all font-mono text-[11px] text-accent">
                  {d.job_id}
                </p>
              </div>
              <span className="shrink-0 rounded-sm border border-line bg-paper px-2 py-1 font-mono text-[11px] text-ink-muted">
                {DOC_TYPE_LABELS[d.doc_type]}
              </span>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-muted/80">
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/*
        NAVIGATION SEAM — in the full product, this confirmation routes to a
        running/results dashboard that polls GET /api/v1/jobs/{job_id} (see
        getJobStatus() in src/api.ts) for each queued job, then surfaces the
        generated compliance alerts. For this intake build the confirmation is
        the terminus. Wire that navigation here, keyed by the job_ids above.
      */}
      <div className="mt-8 flex items-center gap-4 border-t border-line pt-6">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-sm border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          Start another analysis
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
