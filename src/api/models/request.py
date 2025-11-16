"""
Request Models

Pydantic models for API requests
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


class TranslationRequest(BaseModel):
    """Translation request model"""
    text: str = Field(
        ...,
        max_length=10000,
        description="Text to translate"
    )
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        """Validate text contains at least some actual content"""
        if not v or not v.strip():
            raise ValueError("Text cannot be empty")
        # Check if text has at least one letter/character that's not just numbers/punctuation
        if not any(c.isalpha() for c in v):
            raise ValueError("Text must contain at least one letter or meaningful content")
        return v
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

