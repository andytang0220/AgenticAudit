"""
Data models for the Compliance Monitoring Agent API.

This module defines Pydantic models that serve as JSON contracts
between the frontend, backend, and external services (Bright Data scrapers).
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl


class ComplianceFramework(str, Enum):
    """Supported compliance frameworks."""
    SOC_2 = "SOC 2"
    GDPR = "GDPR"
    HIPAA = "HIPAA"
    PCI_DSS = "PCI DSS"
    CCPA = "CCPA"
    ISO_27001 = "ISO 27001"
    OTHER = "OTHER"


class RiskSeverity(str, Enum):
    """Risk severity levels for compliance alerts."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class ComplianceAlert(BaseModel):
    """
    Represents a compliance alert detected by the AI agent.
    
    This model is used for GET /api/v1/compliance-alerts responses.
    """
    alert_id: str = Field(..., description="Unique identifier for the alert")
    risk_severity_score: float = Field(
        ..., 
        ge=0.0, 
        le=100.0,
        description="Risk score from 0-100 indicating severity"
    )
    severity_level: RiskSeverity = Field(
        ..., 
        description="Human-readable severity level"
    )
    summary_of_changes: str = Field(
        ..., 
        description="Brief summary of the compliance-relevant changes detected"
    )
    detailed_findings: str = Field(
        ..., 
        description="Detailed analysis of the compliance issue"
    )
    affected_compliance_framework: List[ComplianceFramework] = Field(
        ..., 
        description="List of compliance frameworks affected by this change"
    )
    bright_data_evidence_url: HttpUrl = Field(
        ..., 
        description="URL where the evidence screenshot/data is hosted on Bright Data"
    )
    source_domain: str = Field(
        ..., 
        description="Domain from which the compliance issue was detected"
    )
    detected_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the alert was detected"
    )
    recommended_action: str = Field(
        ..., 
        description="Recommended action to address the compliance issue"
    )
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "alert_id": "alert_001",
                "risk_severity_score": 85.5,
                "severity_level": "HIGH",
                "summary_of_changes": "Unencrypted personal data transmission detected",
                "detailed_findings": "API endpoint transmitting customer PII over HTTP",
                "affected_compliance_framework": ["GDPR", "SOC 2"],
                "bright_data_evidence_url": "https://evidence.brightdata.com/screenshot_001.png",
                "source_domain": "api.example.com",
                "detected_at": "2026-05-30T10:30:00",
                "recommended_action": "Implement TLS encryption for all data transmission"
            }
        }


class IngestScrapeRequest(BaseModel):
    """
    Request model for POST /api/v1/ingest-scrape endpoint.
    
    Payload sent by Bright Data scrapers to ingest raw HTML content
    for RAG analysis and compliance processing.
    """
    source_url: HttpUrl = Field(
        ..., 
        description="URL that was scraped"
    )
    raw_html_content: str = Field(
        ..., 
        description="Raw HTML content from the scraped page"
    )
    metadata: Optional[dict] = Field(
        default=None,
        description="Optional metadata about the scrape (timestamp, user-agent, etc.)"
    )
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "source_url": "https://example.com/privacy-policy",
                "raw_html_content": "<html>...</html>",
                "metadata": {
                    "scraped_at": "2026-05-30T10:25:00",
                    "user_agent": "Mozilla/5.0..."
                }
            }
        }


class IngestScrapeResponse(BaseModel):
    """
    Response model for POST /api/v1/ingest-scrape endpoint.
    
    Confirms receipt of scrape data and provides task tracking information.
    """
    status: str = Field(..., description="Status of the ingest request")
    job_id: str = Field(..., description="Unique job ID for tracking async processing")
    message: str = Field(..., description="Human-readable status message")
    processing_url: Optional[str] = Field(
        default=None,
        description="URL to check processing status (future enhancement)"
    )
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "status": "accepted",
                "job_id": "job_abc123def456",
                "message": "Scrape data ingested successfully. Processing started.",
                "processing_url": "/api/v1/jobs/job_abc123def456"
            }
        }


class ComplianceAlertsResponse(BaseModel):
    """
    Response model for GET /api/v1/compliance-alerts endpoint.
    
    Returns a paginated list of compliance alerts.
    """
    alerts: List[ComplianceAlert] = Field(..., description="List of compliance alerts")
    total_count: int = Field(..., description="Total number of alerts")
    high_risk_count: int = Field(..., description="Count of high/critical severity alerts")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "alerts": [],
                "total_count": 0,
                "high_risk_count": 0
            }
        }
