"""
Language Detection Executor

Detects the language of input text
"""

import langdetect
from typing import Optional
from .base import BaseExecutor


class LanguageDetectionExecutor(BaseExecutor):
    """Detects language of text"""
    
    def __init__(self):
        # Suppress langdetect warnings
        langdetect.detect_langs("test")
    
    async def execute(self, text: str) -> str:
        """
        Detect language of text
        
        Args:
            text: Text to detect language for
        
        Returns:
            Language code (e.g., 'en', 'es', 'fr')
        """
        try:
            # Detect language
            detected = langdetect.detect(text)
            return detected
        except Exception as e:
            # Fallback to English if detection fails
            logger.warning(f"⚠️  Language detection failed: {e}, defaulting to 'en'")
            return "en"
    
    async def detect_multiple(self, text: str) -> list:
        """
        Get multiple possible languages with confidence scores
        
        Args:
            text: Text to detect language for
        
        Returns:
            List of (language, confidence) tuples
        """
        try:
            languages = langdetect.detect_langs(text)
            return [(lang.lang, lang.prob) for lang in languages]
        except Exception:
            return [("en", 1.0)]

