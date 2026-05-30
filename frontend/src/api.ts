import type {
  AgentQueryRequest,
  AgentQueryResponse,
  AlertsResponse,
  ComplianceAlert,
  IngestRequest,
  IngestResponse,
  IntakeResult,
  JobStatus,
  PendingDocument,
  SubmittedDoc,
} from "./types";

// Mock-first: the page is fully demoable with no backend running. Flip
// VITE_USE_MOCK=false (and run the FastAPI backend on :8000) to hit the wire.
export const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK ?? "true").toLowerCase() !== "false";

const AGENT_ENDPOINT = "http://localhost:8000/agent/query";

// Real backend contract per repo INTEGRATION.md.
const INGEST_ENDPOINT = "/api/v1/ingest-scrape";

/**
 * Send a query to the backend RAG agent (/agent/query).
 * Step 1: ChromaDB semantic search + Brightdata web search (parallel)
 * Step 2: Combined prompt → DeepSeek → final answer
 */
export async function runAgentQuery(
  query: string,
  n_docs = 3
): Promise<AgentQueryResponse> {
  const res = await fetch(AGENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, n_docs } as AgentQueryRequest),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Agent query failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as AgentQueryResponse;
}

/**
 * Submit every uploaded document for compliance analysis.
 *
 * The backend (INTEGRATION.md) accepts one item per POST /api/v1/ingest-scrape
 * call and returns a job_id, so we fan out one request per document and
 * aggregate the job handles. The optional free-text `query` is attached to
 * each item's metadata to guide the analysis.
 */
export async function submitIntake(
  docs: PendingDocument[],
  query?: string
): Promise<IntakeResult> {
  if (USE_MOCK) {
    return mockSubmit(docs);
  }
  return realSubmit(docs, query);
}

/**
 * Fetch the compliance-monitoring alerts — the frontend's documented endpoint
 * in INTEGRATION.md (GET /api/v1/compliance-alerts).
 */
export async function fetchComplianceAlerts(): Promise<AlertsResponse> {
  if (USE_MOCK) {
    await delay(450);
    return MOCK_ALERTS;
  }
  const res = await fetch("/api/v1/compliance-alerts");
  if (!res.ok) {
    throw new Error(
      `Couldn’t load alerts (${res.status} ${res.statusText})`
    );
  }
  return (await res.json()) as AlertsResponse;
}

/** Poll a single job's status. Used by the future running/results view. */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`/api/v1/jobs/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw new Error(`Job status failed (${res.status} ${res.statusText})`);
  }
  return (await res.json()) as JobStatus;
}

// ── Mock path ───────────────────────────────────────────────────────

async function mockSubmit(docs: PendingDocument[]): Promise<IntakeResult> {
  await delay(600);
  const submitted: SubmittedDoc[] = docs.map((d) => {
    const jobId = crypto.randomUUID();
    return {
      local_id: d.local_id,
      name: d.name,
      doc_type: d.doc_type,
      job_id: jobId,
      status: "accepted",
      processing_url: `/api/v1/jobs/${jobId}`,
    };
  });
  return { submitted };
}

// ── Real path ───────────────────────────────────────────────────────

async function realSubmit(
  docs: PendingDocument[],
  query?: string
): Promise<IntakeResult> {
  // Fan out; one ingest call per document.
  const submitted = await Promise.all(docs.map((d) => ingestOne(d, query)));
  return { submitted };
}

async function ingestOne(
  doc: PendingDocument,
  query?: string
): Promise<SubmittedDoc> {
  const body = await buildIngestRequest(doc, query);

  const res = await fetch(INGEST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `“${doc.name}” was rejected (${res.status} ${res.statusText})${
        detail ? `: ${detail}` : ""
      }`
    );
  }

  const data = (await res.json()) as IngestResponse;
  return {
    local_id: doc.local_id,
    name: doc.name,
    doc_type: doc.doc_type,
    job_id: data.job_id,
    status: data.status,
    processing_url: data.processing_url,
  };
}

async function buildIngestRequest(
  doc: PendingDocument,
  query?: string
): Promise<IngestRequest> {
  // .txt files go as UTF-8. Binary documents (PDF/DOCX) are sent
  // base64-encoded — we do NOT parse them client-side; the backend decodes and
  // extracts. metadata.encoding tells it which.
  const isText = doc.name.toLowerCase().endsWith(".txt");

  let raw_html_content: string;
  let encoding: "utf-8" | "base64";

  if (isText) {
    raw_html_content = await readAsText(doc.file);
    encoding = "utf-8";
  } else {
    raw_html_content = await readAsBase64(doc.file);
    encoding = "base64";
  }

  return {
    // The endpoint requires a valid HTTP/HTTPS URL, but uploaded documents have
    // no origin URL — synthesize a stable placeholder; real identity lives in
    // metadata.filename.
    source_url: `https://intake.local/document/${encodeURIComponent(doc.name)}`,
    raw_html_content,
    metadata: {
      filename: doc.name,
      doc_type: doc.doc_type,
      encoding,
      scraped_at: new Date().toISOString(),
      // Only include the query when the user actually entered one.
      ...(query ? { query } : {}),
    },
  };
}

// ── File reading helpers ────────────────────────────────────────────

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is a data URL: "data:<mime>;base64,<payload>" — strip the prefix.
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ── misc ────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Mock alerts (mirrors the INTEGRATION.md response shape/example) ──

const MOCK_ALERT_LIST: ComplianceAlert[] = [
  {
    alert_id: "alert_001",
    risk_severity_score: 85.5,
    severity_level: "HIGH",
    summary_of_changes: "Unencrypted personal data transmission detected",
    detailed_findings:
      "API endpoint transmitting customer PII (email, phone) over HTTP without TLS. Captured payloads include cleartext identifiers across three routes under /v1/customers.",
    affected_compliance_framework: ["GDPR", "SOC 2"],
    bright_data_evidence_url:
      "https://evidence.brightdata.com/screenshot_001.png",
    source_domain: "api.example.com",
    detected_at: "2026-05-30T10:30:00",
    recommended_action: "Implement TLS encryption for all data transmission",
  },
  {
    alert_id: "alert_002",
    risk_severity_score: 96.2,
    severity_level: "CRITICAL",
    summary_of_changes: "Cardholder data stored without tokenization",
    detailed_findings:
      "Checkout flow persists full PAN and CVV to an unsecured logging table. Retention exceeds PCI DSS limits and CVV storage is prohibited outright.",
    affected_compliance_framework: ["PCI DSS"],
    bright_data_evidence_url:
      "https://evidence.brightdata.com/screenshot_002.png",
    source_domain: "shop.example.com",
    detected_at: "2026-05-30T09:12:00",
    recommended_action:
      "Tokenize card data, purge stored CVV, and rotate exposed logs immediately",
  },
  {
    alert_id: "alert_003",
    risk_severity_score: 54.0,
    severity_level: "MEDIUM",
    summary_of_changes: "Cookie banner missing granular consent controls",
    detailed_findings:
      "Consent banner offers only accept-all; no per-category opt-out for analytics or marketing cookies, which are set before consent is recorded.",
    affected_compliance_framework: ["GDPR", "CCPA"],
    bright_data_evidence_url:
      "https://evidence.brightdata.com/screenshot_003.png",
    source_domain: "www.example.com",
    detected_at: "2026-05-29T16:45:00",
    recommended_action:
      "Add granular consent toggles and defer non-essential cookies until consent",
  },
  {
    alert_id: "alert_004",
    risk_severity_score: 22.5,
    severity_level: "LOW",
    summary_of_changes: "Privacy policy last-updated date is stale",
    detailed_findings:
      "Published privacy policy references a revision date over 18 months old and omits the newly added data-processor sub-list.",
    affected_compliance_framework: ["GDPR"],
    bright_data_evidence_url:
      "https://evidence.brightdata.com/screenshot_004.png",
    source_domain: "www.example.com",
    detected_at: "2026-05-28T11:05:00",
    recommended_action: "Refresh the policy revision date and processor list",
  },
];

const MOCK_ALERTS: AlertsResponse = {
  alerts: MOCK_ALERT_LIST,
  total_count: MOCK_ALERT_LIST.length,
  high_risk_count: MOCK_ALERT_LIST.filter(
    (a) => a.severity_level === "CRITICAL" || a.severity_level === "HIGH"
  ).length,
};
