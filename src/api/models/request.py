"""
Request Models

Pydantic models for API requests
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class TranslationRequest(BaseModel):
    """Translation request model"""
    text: str = Field(
        ...,
        max_length=10000,
        description="Text to translate"
    )
    target_languages: List[str] = Field(
        ...,
        min_items=1,
        max_items=5,
        description="Target languages (max 5)"
    )
    source_language: Optional[str] = Field(
        None,
        description="Source language (auto-detected if not provided)"
    )
    preserve_formatting: bool = Field(
        True,
        description="Preserve formatting in translation"
    )


class LanguageDetectionRequest(BaseModel):
    """Language detection request model"""
    text: str = Field(
        ...,
        max_length=10000,
        description="Text to detect language for"
    )

