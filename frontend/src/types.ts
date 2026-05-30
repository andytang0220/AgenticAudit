// ── Intake data contract ────────────────────────────────────────────
// These types ARE the contract between the intake page and the backend.
// Defined once here; imported everywhere. Do not add fields outside this
// file without also updating the FormData assembly in src/api.ts.

export type DocType =
  | "privacy_policy"
  | "dpa"
  | "terms"
  | "disclosure"
  | "policy"
  | "other";

/** A document the user has uploaded locally, before submission. */
export interface PendingDocument {
  local_id: string; // client-side id (crypto.randomUUID())
  name: string;
  file: File; // the uploaded file
  size_bytes: number;
  doc_type: DocType; // user-selectable, defaults to "other"
}

// ── Backend contract (per repo INTEGRATION.md) ──────────────────────
// The implemented backend exposes no document-upload endpoint. The only
// content-submission endpoint is POST /api/v1/ingest-scrape, which accepts
// one item per request and returns a job_id (202 Accepted); status is then
// polled via GET /api/v1/jobs/{job_id}. We submit one ingest request per
// staged document.

/** Body of POST /api/v1/ingest-scrape. */
export interface IngestRequest {
  source_url: string; // must be a valid HTTP/HTTPS URL
  raw_html_content: string; // document content (utf-8 text or base64 — see metadata.encoding)
  metadata: IngestMetadata;
}

export interface IngestMetadata {
  filename: string;
  doc_type: DocType;
  encoding: "utf-8" | "base64";
  scraped_at: string; // ISO 8601
}

/** 202 response from POST /api/v1/ingest-scrape. */
export interface IngestResponse {
  status: string; // "accepted"
  job_id: string;
  message: string;
  processing_url: string; // "/api/v1/jobs/{job_id}"
}

/** GET /api/v1/jobs/{job_id} — used by the future running/results view. */
export type JobStatusValue = "queued" | "processing" | "completed" | "failed";
export interface JobStatus {
  status: JobStatusValue;
  source_url?: string;
  created_at?: string;
  started_at?: string;
  updated_at?: string;
  completed_at?: string;
  alerts_generated?: number;
  error?: string;
}

/** One staged document after it has been accepted (job created). */
export interface SubmittedDoc {
  local_id: string;
  name: string;
  doc_type: DocType;
  job_id: string;
  status: string;
  processing_url: string;
}

/** Aggregate result the intake page shows after submitting all documents. */
export interface IntakeResult {
  submitted: SubmittedDoc[];
}

// ── Compliance dashboard contract (per repo INTEGRATION.md) ──────────
// The frontend's documented endpoint: GET /api/v1/compliance-alerts.

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface ComplianceAlert {
  alert_id: string;
  risk_severity_score: number; // 0-100
  severity_level: SeverityLevel;
  summary_of_changes: string;
  detailed_findings: string;
  affected_compliance_framework: string[];
  bright_data_evidence_url: string;
  source_domain: string;
  detected_at: string; // ISO 8601
  recommended_action: string;
}

export interface AlertsResponse {
  alerts: ComplianceAlert[];
  total_count: number;
  high_risk_count: number;
}

// ── Human-facing labels ─────────────────────────────────────────────

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  privacy_policy: "Privacy Policy",
  dpa: "Data Processing Agreement",
  terms: "Terms of Service",
  disclosure: "Disclosure",
  policy: "Policy",
  other: "Other / Uncategorized",
};

export const DOC_TYPE_ORDER: DocType[] = [
  "privacy_policy",
  "dpa",
  "terms",
  "disclosure",
  "policy",
  "other",
];
