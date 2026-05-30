# Backend API - Compliance Monitoring Agent

Proactive AI compliance monitoring backend for the Bright Data Hackathon.

## 🏗️ Architecture Overview

```
Backend/
├── main.py              # FastAPI application with all endpoints
├── models.py            # Pydantic data models (JSON schemas)
├── config.py            # Configuration management
├── __init__.py          # Package initialization
├── requirements.txt     # Python dependencies
└── .env.example         # Environment variables template
```

## 🚀 Quick Start

### Local Development

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Windows
   # or
   source venv/bin/activate  # macOS/Linux
   ```

2. **Install dependencies:**
   ```bash
   pip install -r Backend/requirements.txt
   ```

3. **Run the server:**
   ```bash
   cd Backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Access API documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📋 API Endpoints

### Health Check
```
GET /health
```
Returns API health status and version.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-30T10:30:00",
  "version": "0.1.0"
}
```

---

### Get Compliance Alerts (Mock Data)
```
GET /api/v1/compliance-alerts?limit=50&offset=0
```
Returns paginated list of compliance alerts detected by the AI agent.

**Query Parameters:**
- `limit` (int, default: 50): Maximum number of alerts to return
- `offset` (int, default: 0): Number of alerts to skip for pagination

**Response (200 OK):**
```json
{
  "alerts": [
    {
      "alert_id": "alert_001",
      "risk_severity_score": 85.5,
      "severity_level": "HIGH",
      "summary_of_changes": "Unencrypted personal data transmission detected",
      "detailed_findings": "API endpoint transmitting customer PII over HTTP...",
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

**Use Case:** Frontend developers can build the dashboard UI with this mock data immediately.

---

### Ingest Scrape Data
```
POST /api/v1/ingest-scrape
```
Accept scraped HTML content from Bright Data scrapers for compliance analysis.

**Request Body:**
```json
{
  "source_url": "https://example.com/privacy-policy",
  "raw_html_content": "<html>...</html>",
  "metadata": {
    "scraped_at": "2026-05-30T10:25:00",
    "user_agent": "Mozilla/5.0..."
  }
}
```

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "job_id": "abc123-def456-ghi789",
  "message": "Scrape data ingested successfully. Processing started.",
  "processing_url": "/api/v1/jobs/abc123-def456-ghi789"
}
```

**Use Case:** Bright Data scraper sends raw HTML → Backend queues for async RAG processing.

---

### Get Job Status
```
GET /api/v1/jobs/{job_id}
```
Check the processing status of a scrape ingestion job.

**Response (200 OK) - Queued:**
```json
{
  "status": "queued",
  "source_url": "https://example.com/page",
  "created_at": "2026-05-30T10:25:00"
}
```

**Response (200 OK) - Processing:**
```json
{
  "status": "processing",
  "started_at": "2026-05-30T10:25:05",
  "updated_at": "2026-05-30T10:25:10"
}
```

**Response (200 OK) - Completed:**
```json
{
  "status": "completed",
  "started_at": "2026-05-30T10:25:05",
  "completed_at": "2026-05-30T10:25:15",
  "alerts_generated": 3
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Job abc123 not found"
}
```

---

## 🧩 Data Models (Pydantic Schemas)

### ComplianceAlert
Main model for compliance alerts with all required fields:
- `alert_id`: Unique identifier
- `risk_severity_score`: 0-100 numeric score
- `severity_level`: CRITICAL, HIGH, MEDIUM, LOW, INFO
- `summary_of_changes`: Brief summary
- `detailed_findings`: Detailed analysis
- `affected_compliance_framework`: List of frameworks (GDPR, SOC 2, HIPAA, PCI DSS, CCPA, ISO 27001)
- `bright_data_evidence_url`: Link to screenshot on Bright Data
- `source_domain`: Domain where issue was detected
- `detected_at`: ISO 8601 timestamp
- `recommended_action`: Recommended remediation

### IngestScrapeRequest
Model for POST /api/v1/ingest-scrape:
- `source_url`: URL that was scraped
- `raw_html_content`: Raw HTML to analyze
- `metadata`: Optional metadata dict

### IngestScrapeResponse
Response model with job tracking:
- `status`: "accepted"
- `job_id`: Unique job identifier
- `message`: Status message
- `processing_url`: URL to check status

---

## 🔄 Async Processing Pipeline

### Current Implementation (BackgroundTasks)
Uses FastAPI's built-in `BackgroundTasks` for async processing:

1. **Scraper sends HTML** → POST /api/v1/ingest-scrape
2. **Backend queues task** → Returns 202 with job_id
3. **Async worker processes** → `process_rag_analysis()` in background
4. **RAG analysis** → (Stub - ready for RAG integration)
5. **Results stored** → (Stub - ready for database integration)

### Future Enhancement: Celery
When you're ready to scale, replace BackgroundTasks with Celery:

```python
# Install: pip install celery redis
# Run: celery -A tasks worker --loglevel=info

from celery import Celery

celery_app = Celery('compliance_agent', broker='redis://localhost:6379')

@celery_app.task
async def process_rag_analysis_celery(job_id: str, source_url: str, raw_html: str):
    # Implementation
    pass
```

---

## 🔌 Integration Points (Placeholders Ready)

### 1. RAG/AI Agent Integration
File: `Backend/main.py`, function `process_rag_analysis()`

**TODO:** Replace asyncio.sleep() with actual RAG API calls:
```python
# TODO: Integrate with RAG system here
compliance_alerts = await rag_system.analyze(raw_html)
db.store_alerts(compliance_alerts, job_id)
```

### 2. Bright Data Integration
Endpoint: POST /api/v1/ingest-scrape

**Current:** Accepts raw HTML payloads
**Future:** Add Bright Data authentication and webhook validation

### 3. Database Integration
File: `Backend/config.py`, variable `database_url`

**TODO:** Replace in-memory `_job_status` with persistent database:
```python
# from sqlalchemy import create_engine
# engine = create_engine(settings.database_url)
```

---

## 📝 Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp Backend/.env.example Backend/.env
```

**Key Variables:**
- `ENVIRONMENT`: development, staging, production
- `DEBUG`: True/False
- `ALLOWED_ORIGINS`: CORS origins (comma-separated)
- `RAG_API_ENDPOINT`: URL for RAG system (future)
- `BRIGHT_DATA_API_KEY`: Bright Data credentials (future)

---

## 🧪 Testing

Run tests:
```bash
pytest Backend/ -v
```

Test specific endpoint:
```bash
pytest Backend/tests/test_endpoints.py -v -k "test_get_alerts"
```

---

## 📦 Production Deployment

### Using Gunicorn + Uvicorn:
```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 🛠️ Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/rag-integration
   ```

2. **Make changes** and test:
   ```bash
   pytest Backend/ -v
   ```

3. **Format code:**
   ```bash
   black Backend/
   flake8 Backend/
   mypy Backend/
   ```

4. **Commit and push:**
   ```bash
   git add Backend/
   git commit -m "feat: add RAG integration"
   git push origin feature/rag-integration
   ```

---

## 📚 Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Pydantic Docs:** https://docs.pydantic.dev/
- **Uvicorn Docs:** https://www.uvicorn.org/

---

## 🤝 Team Notes

### Frontend Team
- Start with GET /api/v1/compliance-alerts (returns mock data)
- Swagger UI available at /docs for interactive testing
- Models defined in [Backend/models.py](models.py)

### Bright Data Integration Team
- Send scraped HTML to POST /api/v1/ingest-scrape
- Receive job_id for tracking
- Check status with GET /api/v1/jobs/{job_id}

### RAG/AI Agent Team
- Integration point: `process_rag_analysis()` in [Backend/main.py](main.py)
- TODO markers show exactly where to add your logic
- No changes needed to API structure

---

## 📞 Support

For questions about the backend scaffolding, check inline code documentation and TODO markers throughout the codebase.
