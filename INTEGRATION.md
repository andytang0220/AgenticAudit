# Team Integration Guide

Specific integration instructions for each team working on the AgenticAudit project.

---

## 🎨 Frontend Team

### Overview
Build the compliance monitoring dashboard UI using the mock data from the backend.

### Getting Started

1. **Backend must be running:**
   ```bash
   cd Backend && uvicorn main:app --reload
   ```

2. **Test the endpoint:**
   ```bash
   curl http://localhost:8000/api/v1/compliance-alerts
   ```

### Main Endpoint

**GET /api/v1/compliance-alerts**

```javascript
// Example JavaScript fetch
fetch('http://localhost:8000/api/v1/compliance-alerts')
  .then(r => r.json())
  .then(data => {
    console.log('Total alerts:', data.total_count);
    console.log('High risk alerts:', data.high_risk_count);
    console.log('Alerts:', data.alerts);
  });
```

### Data Structure

Each alert has:

```typescript
interface ComplianceAlert {
  alert_id: string;                        // Unique identifier
  risk_severity_score: number;             // 0-100
  severity_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  summary_of_changes: string;              // Brief summary
  detailed_findings: string;               // Full details
  affected_compliance_framework: string[]; // ['GDPR', 'SOC 2', ...]
  bright_data_evidence_url: string;        // Link to screenshot
  source_domain: string;                   // Where detected
  detected_at: string;                     // ISO 8601 timestamp
  recommended_action: string;              // What to do
}
```

### Response Example

```json
{
  "alerts": [
    {
      "alert_id": "alert_001",
      "risk_severity_score": 85.5,
      "severity_level": "HIGH",
      "summary_of_changes": "Unencrypted personal data transmission detected",
      "detailed_findings": "API endpoint transmitting customer PII (email, phone) over HTTP...",
      "affected_compliance_framework": ["GDPR", "SOC 2"],
      "bright_data_evidence_url": "https://evidence.brightdata.com/screenshot_001.png",
      "source_domain": "api.example.com",
      "detected_at": "2026-05-30T10:30:00",
      "recommended_action": "Implement TLS encryption for all data transmission"
    }
  ],
  "total_count": 4,
  "high_risk_count": 2
}
```

### UI Recommendations

- Display alerts in a table or card layout
- Color-code by severity: Red (CRITICAL/HIGH), Yellow (MEDIUM), Gray (LOW/INFO)
- Show risk score as a progress bar or gauge
- Link to bright_data_evidence_url for screenshots
- Display last detected_at timestamp

### CORS Configuration

The backend has CORS enabled for `*` origins in development. For production, update [Backend/config.py](Backend/config.py):

```python
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

### Interactive Testing

Use Swagger UI at http://localhost:8000/docs to:
- Test endpoints
- See request/response schemas
- Try different query parameters

---

## 🕷️ Bright Data Integration Team

### Overview
Send scraped HTML to the backend for asynchronous compliance analysis.

### Main Endpoint

**POST /api/v1/ingest-scrape** (202 Accepted)

### Implementation Flow

```
1. Scraper finishes → Raw HTML ready
2. POST to /api/v1/ingest-scrape
3. Receive job_id in response
4. Poll GET /api/v1/jobs/{job_id} to track status
```

### Step 1: Send Scraped Data

```bash
curl -X POST http://localhost:8000/api/v1/ingest-scrape \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://example.com/privacy-policy",
    "raw_html_content": "<html>...</html>",
    "metadata": {
      "scraped_at": "2026-05-30T10:25:00",
      "user_agent": "Mozilla/5.0...",
      "response_time_ms": 1245
    }
  }'
```

### Response (202 Accepted)

```json
{
  "status": "accepted",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Scrape data ingested successfully. Processing started.",
  "processing_url": "/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000"
}
```

### Step 2: Track Job Status

```bash
curl http://localhost:8000/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000
```

**Status: Queued**
```json
{
  "status": "queued",
  "source_url": "https://example.com/page",
  "created_at": "2026-05-30T10:25:00"
}
```

**Status: Processing**
```json
{
  "status": "processing",
  "started_at": "2026-05-30T10:25:05",
  "updated_at": "2026-05-30T10:25:10"
}
```

**Status: Completed**
```json
{
  "status": "completed",
  "started_at": "2026-05-30T10:25:05",
  "completed_at": "2026-05-30T10:25:15",
  "alerts_generated": 3
}
```

### Python Example

```python
import requests
import time

# Step 1: Submit scrape
response = requests.post(
    'http://localhost:8000/api/v1/ingest-scrape',
    json={
        'source_url': 'https://example.com/page',
        'raw_html_content': '<html>...</html>',
        'metadata': {
            'scraped_at': '2026-05-30T10:25:00'
        }
    }
)

job_data = response.json()
job_id = job_data['job_id']
print(f"Job submitted: {job_id}")

# Step 2: Poll status
while True:
    status_response = requests.get(
        f'http://localhost:8000/api/v1/jobs/{job_id}'
    )
    status = status_response.json()
    
    if status['status'] == 'completed':
        print(f"Completed! Alerts generated: {status['alerts_generated']}")
        break
    elif status['status'] == 'failed':
        print(f"Failed: {status['error']}")
        break
    else:
        print(f"Status: {status['status']}...")
        time.sleep(2)
```

### Request Validation

The endpoint validates:
- ✅ `source_url` is a valid URL (HTTP/HTTPS)
- ✅ `raw_html_content` is not empty
- ✅ `metadata` is optional but must be a dict if provided

Invalid requests return 422 Unprocessable Entity with validation errors.

### Best Practices

1. **Always include metadata** with scrape context
2. **Implement retry logic** for network failures
3. **Respect rate limits** (add headers if needed)
4. **Log job_ids** for troubleshooting
5. **Handle timeout** appropriately when polling

---

## 🤖 RAG/AI Agent Integration Team

### Overview
Implement the compliance analysis logic that processes scraped HTML and generates alerts.

### Integration Point

File: [Backend/main.py](Backend/main.py), function: `process_rag_analysis()`

Located at approximately line 92.

### Current Implementation

```python
async def process_rag_analysis(job_id: str, source_url: str, raw_html: str) -> None:
    """
    Async worker function to process scraped HTML through RAG/AI pipeline.
    """
    try:
        logger.info(f"Starting RAG analysis for job {job_id} from {source_url}")
        
        _job_status[job_id] = {"status": "processing", ...}
        
        # TODO: Integrate with RAG system here
        # compliance_alerts = await rag_system.analyze(raw_html)
        
        # TODO: Store alerts in database
        # db.store_alerts(compliance_alerts, job_id)
        
        _job_status[job_id] = {"status": "completed", ...}
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        _job_status[job_id] = {"status": "failed", ...}
```

### What You Need to Implement

1. **Parse HTML**
   ```python
   from bs4 import BeautifulSoup
   
   soup = BeautifulSoup(raw_html, 'html.parser')
   # Extract relevant text, forms, links, etc.
   ```

2. **Send to RAG System**
   ```python
   # Prepare prompt
   prompt = f"""
   Analyze this website HTML for compliance violations:
   {extracted_text}
   
   Check for:
   - GDPR compliance (data privacy, consent)
   - SOC 2 compliance (security controls)
   - HIPAA compliance (healthcare data)
   - PCI DSS compliance (payment card data)
   - CCPA compliance (consumer privacy)
   - ISO 27001 compliance (information security)
   """
   
   # Call RAG endpoint
   rag_response = await rag_client.analyze(prompt)
   ```

3. **Parse RAG Response**
   ```python
   compliance_alerts = []
   for alert_data in rag_response['alerts']:
       alert = ComplianceAlert(
           alert_id=uuid.uuid4(),
           risk_severity_score=alert_data['score'],
           severity_level=alert_data['level'],
           # ... map all fields
       )
       compliance_alerts.append(alert)
   ```

4. **Store in Database**
   ```python
   # TODO: Replace in-memory _job_status with database
   from sqlalchemy.orm import Session
   
   db = get_database()
   for alert in compliance_alerts:
       db.add(AlertModel(**alert.dict()))
   db.commit()
   ```

5. **Update Job Status**
   ```python
   _job_status[job_id] = {
       "status": "completed",
       "alerts_generated": len(compliance_alerts),
       # ...
   }
   ```

### Expected Input

```python
# Parameters passed to function:
job_id = "550e8400-e29b-41d4-a716-446655440000"
source_url = "https://example.com/privacy-policy"
raw_html = "<html>...</html>"  # Full page HTML
```

### Expected Output

Store `ComplianceAlert` objects with:
- `alert_id`: Unique identifier
- `risk_severity_score`: 0-100
- `severity_level`: CRITICAL/HIGH/MEDIUM/LOW/INFO
- `summary_of_changes`: Brief summary
- `detailed_findings`: Full analysis
- `affected_compliance_framework`: List of frameworks
- `bright_data_evidence_url`: Link to screenshot
- `source_domain`: Extracted from source_url
- `detected_at`: Now
- `recommended_action`: Remediation steps

### Database Integration

Currently using in-memory dict: `_job_status`

**When ready to persist:**

1. Define SQLAlchemy models in [Backend/models.py](Backend/models.py)
2. Create database session in startup event
3. Replace in-memory logic with database queries

### Async Considerations

- Function runs in background (won't block frontend requests)
- Use `await asyncio.sleep()` for simulating work
- Replace with actual async API calls to RAG system
- Log progress for debugging

### Error Handling

Errors are automatically caught and logged:

```python
except Exception as e:
    logger.error(f"Error processing job {job_id}: {str(e)}", exc_info=True)
    _job_status[job_id] = {
        "status": "failed",
        "error": str(e),
    }
```

### Testing Your Integration

1. **Start backend:**
   ```bash
   cd Backend && uvicorn main:app --reload
   ```

2. **Submit test scrape:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/ingest-scrape \
     -H "Content-Type: application/json" \
     -d '{"source_url": "https://example.com", "raw_html_content": "<html>test</html>"}'
   ```

3. **Check job status:**
   ```bash
   curl http://localhost:8000/api/v1/jobs/{job_id}
   ```

4. **View logs:**
   - Check terminal where uvicorn is running
   - Search for your job_id in logs

---

## 🔄 Full Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  1. SCRAPER SENDS DATA                                           │
│     POST /api/v1/ingest-scrape                                   │
│     {source_url, raw_html_content, metadata}                     │
│          │                                                        │
│          ▼                                                        │
│  2. BACKEND RECEIVES & QUEUES                                    │
│     Returns 202 Accepted + {job_id, status: "queued"}            │
│          │                                                        │
│          ▼                                                        │
│  3. ASYNC WORKER STARTS                                          │
│     process_rag_analysis() in background                         │
│     Status changes to "processing"                               │
│          │                                                        │
│          ▼                                                        │
│  4. RAG/AI ANALYZES                                              │
│     Send HTML to RAG system                                      │
│     Get compliance findings back                                 │
│          │                                                        │
│          ▼                                                        │
│  5. GENERATE ALERTS                                              │
│     Create ComplianceAlert objects                               │
│     Store in database (future)                                   │
│          │                                                        │
│          ▼                                                        │
│  6. UPDATE STATUS                                                │
│     Status changes to "completed"                                │
│     Include alerts_generated count                               │
│          │                                                        │
│          ▼                                                        │
│  7. FRONTEND FETCHES ALERTS                                      │
│     GET /api/v1/compliance-alerts                                │
│     Displays in dashboard                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Common Integration Issues

### Issue: Endpoint returns 422 Validation Error
**Solution:** Check your JSON matches the schema:
- `source_url` must be valid URL
- `raw_html_content` must be non-empty string
- See Swagger UI at /docs for exact schema

### Issue: Job status remains "processing" forever
**Solution:** 
- Check logs for errors in `process_rag_analysis()`
- Verify RAG system is reachable
- Check database connections

### Issue: CORS errors when frontend calls backend
**Solution:** 
- Backend CORS is open in dev (`*`)
- For production, configure in [Backend/config.py](Backend/config.py)

### Issue: Out of memory with large HTML payloads
**Solution:**
- Implement HTML size limits
- Stream large files instead of buffering
- Add request validation in Pydantic

---

## 📚 All Available Endpoints

| Method | Endpoint | Purpose | Handled By |
|--------|----------|---------|-----------|
| GET | /health | Health check | Backend |
| GET | /api/v1/compliance-alerts | Get mock alerts | Frontend |
| POST | /api/v1/ingest-scrape | Ingest scrape data | Bright Data |
| GET | /api/v1/jobs/{job_id} | Track job status | RAG Team |

---

## 🤝 Team Communication Checklist

- [ ] Frontend: Confirmed mock data structure
- [ ] Bright Data: Tested POST endpoint with sample HTML
- [ ] RAG Team: Reviewed integration point in main.py
- [ ] All: Can access http://localhost:8000/docs
- [ ] All: Understand job_id tracking flow
- [ ] All: Know which status values to expect

---

## 📞 Next Steps

1. **Share Slack channel** for real-time coordination
2. **Schedule weekly syncs** to discuss blockers
3. **Use Swagger UI** (/docs) for testing
4. **Document custom implementations** for handoff

Let's build something great! 🚀
