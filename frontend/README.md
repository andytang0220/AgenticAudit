# AgenticAudit — Frontend

Two surfaces, switchable via the top-nav tabs (no router — a `useState` toggle
in `App.tsx`):

- **Monitor** — the compliance-monitoring dashboard `INTEGRATION.md` assigns to
  the frontend: fetches `GET /api/v1/compliance-alerts` and renders
  severity-coded `ComplianceAlert`s with risk meters, frameworks, and evidence
  links.
- **Intake** — upload documents (PDF/DOCX/TXT), tag each one's type, optionally
  add a free-text analysis query, and submit them for analysis.

> Scope note: `INTEGRATION.md` defines the frontend's role as the **Monitor**
> dashboard only. The **Intake** page is an added surface; since the backend
> exposes no document-upload endpoint, intake submits via the documented
> `POST /api/v1/ingest-scrape` (owned by the Bright Data team) — see the
> impedance notes below. Worth a backend sync if a dedicated document-ingest
> endpoint is wanted.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Runs in **mock mode** by default — fully demoable with no backend. Submitting
waits ~600ms and returns a fabricated `job_id` per document.

## Stack

React + Vite + TypeScript · Tailwind CSS v3 · lucide-react. No router, no state
library (`useState` only).

## Backend boundary

All network access goes through `src/api.ts`, gated by `USE_MOCK`
(`VITE_USE_MOCK`, default `true`). Flip to `false` in `.env` to target the real
FastAPI backend (Vite proxies `/api` → `http://localhost:8000`).

### Monitor — `GET /api/v1/compliance-alerts`

`fetchComplianceAlerts()` returns `{ alerts: ComplianceAlert[], total_count,
high_risk_count }` exactly per `INTEGRATION.md`. Severity color-coding follows
its UI guidance (red CRITICAL/HIGH · amber MEDIUM · gray LOW/INFO), expressed
through the dossier palette. Mock mode serves a fabricated set mirroring the
documented example.

### Intake — `POST /api/v1/ingest-scrape`

The backend has no document-upload endpoint; the only content-submission
endpoint accepts one item per request and returns a `job_id`, which is then
polled. So we **fan out one request per uploaded document**:

```
POST /api/v1/ingest-scrape        (202 Accepted, one call per document)
  {
    source_url:        string,    // valid HTTP/HTTPS URL (see note 1)
    raw_html_content:  string,    // document content (see note 2)
    metadata: {
      filename, doc_type,
      encoding,                   // "utf-8" | "base64"
      scraped_at,                 // ISO 8601
      query                       // optional free-text analysis instruction
    }
  }
→ { status, job_id, message, processing_url }

GET /api/v1/jobs/{job_id}         // status polling — used by the future
                                  // running/results view (getJobStatus())
```

Two intake-vs-`ingest-scrape` impedance points, resolved here and worth a
backend sync:

1. **`source_url` is required** but uploaded documents have no origin URL — we
   synthesize `https://intake.local/document/<filename>`; real identity is in
   `metadata.filename`.
2. **Binary files vs. a string `raw_html_content`** — `.txt` files are sent as
   UTF-8; PDF/DOCX are sent **base64-encoded** (no client-side parsing,
   lossless). `metadata.encoding` tells the backend which, so it can decode and
   run its own extraction.

Types are the contract — defined once in `src/types.ts`.

## Layout

```
src/
  App.tsx                  # top-nav view switch: Intake ↔ Monitor
  types.ts                 # all contract types (intake + ingest + alerts), labels
  api.ts                   # submitIntake(), fetchComplianceAlerts(), getJobStatus()
  lib/
    intake.ts              # file validation, size formatting, dup-name disambiguation
    alerts.ts              # severity color mapping + timestamp formatting
  components/
    IntakeView.tsx         # state machine: editing → submitting → submitted
    Dropzone.tsx           # drag-drop + click-to-browse
    DocumentRow.tsx        # uploaded-doc row (icon, size, type select, remove)
    DocTypeSelect.tsx
    SubmittedView.tsx      # confirmation (per-doc job_ids); seam for future routing
    ComplianceDashboard.tsx# Monitor: fetch + loading/error/empty + alert list
    AlertCard.tsx          # one severity-coded ComplianceAlert
```

The future navigation point (jobs queued → running/results view that polls
`/api/v1/jobs/{job_id}`) is marked with a `NAVIGATION SEAM` comment in
`SubmittedView.tsx`.
