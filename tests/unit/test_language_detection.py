"""Unit tests for language detection"""

import pytest
from src.executors.language_detection import LanguageDetectionExecutor


@pytest.mark.asyncio
async def test_detect_english():
    """Test English language detection"""
    detector = LanguageDetectionExecutor()
    result = await detector.execute("Hello world")
    
    assert result == "en"


@pytest.mark.asyncio
async def test_detect_spanish():
    """Test Spanish language detection"""
    detector = LanguageDetectionExecutor()
    result = await detector.execute("Hola mundo")
    
    assert result == "es"

