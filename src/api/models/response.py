"""
Response Models

Pydantic models for API responses
"""

from pydantic import BaseModel
from typing import Dict, Any


class TranslationResponse(BaseModel):
    """Translation response model"""
    request_id: str
    source_language: str
    translations: Dict[str, str]
    quality_scores: Dict[str, float]
    processing_time_ms: int
    cached: bool
    metadata: Dict[str, Any]


class LanguageDetectionResponse(BaseModel):
    """Language detection response model"""
    language: str
    text: str
    confidence: float = 1.0


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    provider: str
    model: str
    cost: str
    limits: Dict[str, Any]


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    message: str
    details: Dict[str, Any] = {}

