# Information Security & Data Protection Policy

**Northwind Trading Co.**
Document ID: NW-POL-SEC-002
Version: 4.0
Effective Date: January 1, 2026
Owner: Office of the Chief Information Security Officer (CISO)
Review Cycle: Annual

> *Fictional sample document for testing purposes only.*

---

## 1. Purpose & Scope

This policy defines the minimum security and data-protection controls required to protect Northwind Trading Co. ("Northwind") information assets and the personal data of Northwind customers and employees. It applies to all Northwind systems and to any third party ("Processor") that stores, processes, or transmits Northwind data. Where a third party is involved, the third party must meet or exceed every control in this policy.

## 2. Data Classification

Northwind data is classified as:

- **Restricted** — customer personal data (PII), payment data, credentials, health data.
- **Confidential** — contracts, pricing, internal financials, source code.
- **Internal** — routine business communications and documentation.
- **Public** — approved marketing and published materials.

Controls in this policy apply in full to Restricted and Confidential data.

## 3. Encryption

3.1. **Data at rest** containing Restricted or Confidential information must be encrypted using **AES-256** or an equivalent approved algorithm.

3.2. **Data in transit** must be encrypted using **TLS 1.2 or higher**. TLS 1.0 and 1.1 are prohibited.

3.3. Encryption keys must be managed in a dedicated key-management system with access restricted to authorized personnel. Keys must be rotated at least **every 12 months**.

## 4. Access Control

4.1. **Multi-factor authentication (MFA)** is mandatory for all user and administrative access to any system that stores or processes Restricted data.

4.2. Access must follow the principle of **least privilege** — users receive only the access required for their role.

4.3. **Shared or generic accounts are prohibited** for any system handling Restricted data. Each user must have a uniquely attributable account.

4.4. Access rights must be **reviewed at least quarterly**, and revoked within **24 hours** of an employee's termination or role change.

4.5. Passwords must be a minimum of **12 characters** and screened against known-compromised password lists.

## 5. Breach & Incident Notification

5.1. Processors must notify Northwind of any confirmed or reasonably suspected security breach affecting Northwind data **within 24 hours** of discovery.

5.2. The notification must include, to the extent known: the nature of the incident, the categories and approximate number of records affected, and the remediation steps taken or planned.

5.3. Processors must maintain a documented **incident response plan** and test it at least annually.

5.4. Northwind will handle any required notification to regulators or affected individuals in accordance with applicable law.

## 6. Data Retention & Deletion

6.1. Customer personal data (PII) shall be retained for no longer than **7 years** unless a longer period is legally required.

6.2. On termination of a contract or relationship, a Processor must securely delete or return all Northwind data within **90 calendar days** and certify the deletion in writing.

6.3. Deletion must render the data unrecoverable (e.g., cryptographic erasure or secure overwrite).

## 7. Data Residency & Sub-Processors

7.1. Northwind Restricted data must be stored and processed only within the **United States or the European Union** unless Northwind grants prior written approval for another location.

7.2. A Processor must obtain Northwind's prior approval and provide at least **30 days' written notice** before engaging any new sub-processor that will handle Restricted data.

7.3. The Processor remains liable for the acts and omissions of its sub-processors.

## 8. Resilience & Testing

8.1. Backups of Restricted and Confidential data must be performed at least **daily**, stored encrypted, and **restore-tested at least quarterly**.

8.2. Systems handling Restricted data must undergo an **independent third-party penetration test at least annually**, with material findings remediated on a risk-prioritized schedule.

8.3. Critical security patches must be applied within **30 days** of release; actively exploited vulnerabilities within **7 days**.

## 9. Certifications & Evidence

9.1. Processors handling Restricted data must hold a current **SOC 2 Type II** report or an equivalent recognized certification (e.g., ISO/IEC 27001), and provide it to Northwind on request.

9.2. Processors must complete the Northwind security questionnaire annually.

## 10. Acceptable Use (Internal)

10.1. Northwind systems and data may be used only for legitimate business purposes.

10.2. Restricted data must not be copied to unmanaged personal devices, personal email, or unapproved cloud storage.

10.3. Suspected security incidents must be reported to the CISO office immediately.

---

*End of document NW-POL-SEC-002.*
