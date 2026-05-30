"""
Configuration management for the Compliance Monitoring Agent API.

Uses pydantic-settings to load configuration from environment variables.
Supports .env files for local development.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    api_title: str = "Compliance Monitoring Agent API"
    api_version: str = "0.1.0"
    api_description: str = (
        "Proactive AI compliance monitoring backend for the Bright Data Hackathon"
    )
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"  # development, staging, production
    debug: bool = True
    
    # CORS Configuration
    allowed_origins: str = "*"  # Comma-separated list of origins
    
    # Database Configuration (placeholder for future use)
    database_url: Optional[str] = None
    
    # RAG/Agent Configuration (placeholder for future integration)
    rag_api_endpoint: Optional[str] = None
    rag_api_key: Optional[str] = None
    
    # Bright Data Configuration (placeholder for future integration)
    bright_data_api_key: Optional[str] = None
    bright_data_api_endpoint: Optional[str] = None
    
    # Logging Configuration
    log_level: str = "INFO"
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
