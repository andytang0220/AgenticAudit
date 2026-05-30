"""
Example tests for the Compliance Monitoring Agent API.

Run with: pytest Backend/tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add Backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app

client = TestClient(app)


class TestHealthCheck:
    """Tests for GET /health endpoint."""
    
    def test_health_check_returns_200(self):
        """Health check should return 200 OK."""
        response = client.get("/health")
        assert response.status_code == 200
        
    def test_health_check_returns_healthy_status(self):
        """Health check response should contain status=healthy."""
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data


class TestComplianceAlertsEndpoint:
    """Tests for GET /api/v1/compliance-alerts endpoint."""
    
    def test_get_compliance_alerts_returns_200(self):
        """Should return 200 OK."""
        response = client.get("/api/v1/compliance-alerts")
        assert response.status_code == 200
        
    def test_get_compliance_alerts_returns_valid_schema(self):
        """Should return valid ComplianceAlertsResponse schema."""
        response = client.get("/api/v1/compliance-alerts")
        data = response.json()
        
        assert "alerts" in data
        assert "total_count" in data
        assert "high_risk_count" in data
        assert isinstance(data["alerts"], list)
        assert isinstance(data["total_count"], int)
        
    def test_get_compliance_alerts_contains_mock_data(self):
        """Should return mock alerts."""
        response = client.get("/api/v1/compliance-alerts")
        data = response.json()
        
        assert data["total_count"] > 0
        assert len(data["alerts"]) > 0
        
    def test_get_compliance_alerts_alert_structure(self):
        """Each alert should have all required fields."""
        response = client.get("/api/v1/compliance-alerts")
        data = response.json()
        
        alert = data["alerts"][0]
        required_fields = {
            "alert_id",
            "risk_severity_score",
            "severity_level",
            "summary_of_changes",
            "detailed_findings",
            "affected_compliance_framework",
            "bright_data_evidence_url",
            "source_domain",
            "detected_at",
            "recommended_action",
        }
        
        assert set(alert.keys()) == required_fields
        
    def test_get_compliance_alerts_pagination(self):
        """Should support limit and offset pagination."""
        response1 = client.get("/api/v1/compliance-alerts?limit=2&offset=0")
        data1 = response1.json()
        
        response2 = client.get("/api/v1/compliance-alerts?limit=2&offset=2")
        data2 = response2.json()
        
        assert len(data1["alerts"]) == 2
        assert data1["alerts"] != data2["alerts"]


class TestIngestScrapeEndpoint:
    """Tests for POST /api/v1/ingest-scrape endpoint."""
    
    def test_ingest_scrape_returns_202(self):
        """Should return 202 Accepted status."""
        payload = {
            "source_url": "https://example.com/page",
            "raw_html_content": "<html><body>Test</body></html>",
        }
        response = client.post("/api/v1/ingest-scrape", json=payload)
        assert response.status_code == 202
        
    def test_ingest_scrape_returns_job_id(self):
        """Should return job_id for tracking."""
        payload = {
            "source_url": "https://example.com/page",
            "raw_html_content": "<html><body>Test</body></html>",
        }
        response = client.post("/api/v1/ingest-scrape", json=payload)
        data = response.json()
        
        assert "job_id" in data
        assert len(data["job_id"]) > 0
        
    def test_ingest_scrape_returns_valid_schema(self):
        """Should return valid IngestScrapeResponse schema."""
        payload = {
            "source_url": "https://example.com/page",
            "raw_html_content": "<html><body>Test</body></html>",
        }
        response = client.post("/api/v1/ingest-scrape", json=payload)
        data = response.json()
        
        required_fields = {"status", "job_id", "message", "processing_url"}
        assert set(data.keys()) == required_fields
        assert data["status"] == "accepted"
        
    def test_ingest_scrape_with_metadata(self):
        """Should accept optional metadata."""
        payload = {
            "source_url": "https://example.com/page",
            "raw_html_content": "<html><body>Test</body></html>",
            "metadata": {
                "scraped_at": "2026-05-30T10:25:00",
                "user_agent": "Mozilla/5.0...",
            },
        }
        response = client.post("/api/v1/ingest-scrape", json=payload)
        assert response.status_code == 202
        
    def test_ingest_scrape_missing_required_field(self):
        """Should reject payload missing required fields."""
        payload = {
            "source_url": "https://example.com/page",
            # missing raw_html_content
        }
        response = client.post("/api/v1/ingest-scrape", json=payload)
        assert response.status_code == 422  # Validation error


class TestJobStatusEndpoint:
    """Tests for GET /api/v1/jobs/{job_id} endpoint."""
    
    def test_get_job_status_for_valid_job(self):
        """Should return status for valid job_id."""
        # First, ingest a scrape
        payload = {
            "source_url": "https://example.com/page",
            "raw_html_content": "<html><body>Test</body></html>",
        }
        ingest_response = client.post("/api/v1/ingest-scrape", json=payload)
        job_id = ingest_response.json()["job_id"]
        
        # Then check status
        status_response = client.get(f"/api/v1/jobs/{job_id}")
        assert status_response.status_code == 200
        
    def test_get_job_status_returns_status_field(self):
        """Job status should include status field."""
        payload = {
            "source_url": "https://example.com/page",
            "raw_html_content": "<html><body>Test</body></html>",
        }
        ingest_response = client.post("/api/v1/ingest-scrape", json=payload)
        job_id = ingest_response.json()["job_id"]
        
        status_response = client.get(f"/api/v1/jobs/{job_id}")
        data = status_response.json()
        
        assert "status" in data
        assert data["status"] in ["queued", "processing", "completed", "failed"]
        
    def test_get_job_status_for_invalid_job(self):
        """Should return 404 for invalid job_id."""
        response = client.get("/api/v1/jobs/invalid-job-id-12345")
        assert response.status_code == 404


class TestDataModels:
    """Tests for data model validation."""
    
    def test_compliance_alert_risk_score_validation(self):
        """Risk score should be between 0 and 100."""
        from models import ComplianceAlert, RiskSeverity, ComplianceFramework
        
        # Valid score
        alert = ComplianceAlert(
            alert_id="test_001",
            risk_severity_score=50.0,
            severity_level=RiskSeverity.MEDIUM,
            summary_of_changes="Test change",
            detailed_findings="Test findings",
            affected_compliance_framework=[ComplianceFramework.GDPR],
            bright_data_evidence_url="https://example.com/image.png",
            source_domain="example.com",
            recommended_action="Test action",
        )
        assert alert.risk_severity_score == 50.0
        
        # Invalid score (should raise validation error)
        with pytest.raises(Exception):  # Pydantic ValidationError
            ComplianceAlert(
                alert_id="test_002",
                risk_severity_score=150.0,  # Too high
                severity_level=RiskSeverity.MEDIUM,
                summary_of_changes="Test change",
                detailed_findings="Test findings",
                affected_compliance_framework=[ComplianceFramework.GDPR],
                bright_data_evidence_url="https://example.com/image.png",
                source_domain="example.com",
                recommended_action="Test action",
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
