# Northwind Trading Co. — Compliance Reference Documents

> **FICTIONAL SAMPLE DATA.** Northwind Trading Co. is a made-up company. All names, figures, addresses, and policies below are invented for testing purposes only and do not reflect any real organization, real legal requirements, or professional advice.

## What this is

A set of internal "source-of-truth" business documents for a fictional mid-sized B2B distribution and services company. They are designed to be loaded as the **reference corpus** for a compliance agent. When a user uploads a document (a vendor contract, an expense report, a security questionnaire, a purchase request, etc.), the agent compares it against these documents and reports where it complies and where it falls short.

Each document is intentionally written with **specific, checkable requirements** — dollar thresholds, time windows, required clauses, prohibited items — so the agent has concrete criteria to evaluate against rather than vague principles.

## Company snapshot (for context)

- **Name:** Northwind Trading Co.
- **Type:** B2B wholesale distribution + managed services, mid-sized (~800 employees)
- **HQ:** Columbus, Ohio, USA
- **Standard payment terms:** Net 45
- **Standard governing law for contracts:** State of Ohio, USA

## The documents

| File | What it governs | Typical uploaded document it checks |
|------|-----------------|-------------------------------------|
| `01_vendor_code_of_conduct.md` | Standards every supplier/vendor must meet | A vendor's contract, signed code of conduct, or onboarding packet |
| `02_information_security_policy.md` | Data protection & security controls | A vendor security questionnaire, a Data Processing Agreement, or an InfoSec attestation |
| `03_travel_and_expense_policy.md` | Reimbursable business expenses | An employee expense report |
| `04_procurement_policy.md` | How purchases get approved and sourced | A purchase requisition, PO, or vendor contract |

## Ready-made test scenarios

Use these to validate that your agent actually catches violations. Each pair gives you one document that should **PASS** and one that should **FAIL**, with the specific rule in play.

### Vendor Code of Conduct
- **Should PASS:** A vendor contract stating $2M per-occurrence general liability insurance, SOC 2 Type II certification, Net 45 terms, and a signed code acknowledgment.
- **Should FAIL:** A vendor contract with only $500K general liability insurance, no SOC 2 certification, Net 30 terms, and a clause allowing the vendor to subcontract 60% of the work without notice. *(Fails insurance minimum, certification requirement, payment terms, and subcontracting cap.)*

### Information Security Policy
- **Should PASS:** A security questionnaire confirming AES-256 at rest, TLS 1.3 in transit, MFA on all systems, 24-hour breach notification, and US/EU-only data residency.
- **Should FAIL:** A questionnaire stating data is encrypted "where feasible," breach notification "within 30 days," no MFA mentioned, and data stored in a region outside the US/EU. *(Fails encryption, notification window, access control, and data residency.)*

### Travel & Expense Policy
- **Should PASS:** An expense report submitted 12 days after the trip with itemized receipts for every item over $25, economy airfare on a 4-hour flight, and a $210/night hotel in a standard city.
- **Should FAIL:** An expense report submitted 75 days after the trip, a $480/night hotel in a standard city, a business-class ticket on a 3-hour flight, a $120 mini-bar charge, and a $90 parking fine. *(Fails submission window, hotel cap, airfare class, and includes multiple prohibited items.)*

### Procurement Policy
- **Should PASS:** A $40,000 purchase request with three written quotes attached, department-head and VP sign-off, and an approved-vendor selection.
- **Should FAIL:** A $90,000 purchase split into two $45,000 requisitions to the same vendor, with only one quote and no VP approval. *(Fails the anti-splitting rule, competitive-bid requirement, and approval threshold.)*

## Suggested agent output format

Rather than a bare "compliant / not compliant," have the agent emit, per document: an overall status, then a line-item list of **requirement → finding → pass/fail → the exact source clause it relied on**. That makes the result auditable and easy to debug.
