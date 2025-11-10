"""
Translation Agent

Main translation bot with ROMA integration
"""

import asyncio
import time
import uuid
from typing import List, Dict, Optional
from .roma_integration import TranslationROMA
from .config_loader import get_config_loader
from ..services.translation_providers import MultiProviderTranslationService
from ..services.cache_service import SimpleCacheService
from ..services.database_service import DatabaseService
from ..executors.language_detection import LanguageDetectionExecutor
from ..executors.translation import TranslationExecutor
from ..executors.quality_check import QualityCheckExecutor
from ..executors.format_preservation import FormatPreservationExecutor


class TranslationBot:
    """Main translation bot with ROMA integration"""
    
    def __init__(self):
        # Load configuration
        self.config_loader = get_config_loader()
        self.config = self.config_loader.get_config()
        
        # Initialize services
        self.translation_service = MultiProviderTranslationService()
        self.cache = SimpleCacheService()
        self.db = DatabaseService()
        
        # Initialize executors
        self.lang_detector = LanguageDetectionExecutor()
        self.translation_executor = TranslationExecutor(
            self.translation_service, self.cache, self.db
        )
        self.quality_checker = QualityCheckExecutor()
        self.format_preserver = FormatPreservationExecutor()
        
        # Initialize ROMA integration
        self.roma = TranslationROMA(self.translation_service)
        
        # Database will be initialized on first use
    
    async def translate(
        self,
        text: str,
        target_languages: List[str],
        source_language: Optional[str] = None,
        preserve_formatting: bool = True
    ) -> Dict:
        """
        Translate text to multiple languages using ROMA framework
        
        Args:
            text: Text to translate
            target_languages: List of target language codes
            source_language: Source language code (auto-detected if None)
            preserve_formatting: Whether to preserve formatting
        
        Returns:
            Dictionary with translations, quality scores, and metadata
        """
        start_time = time.time()
        
        # Initialize database if needed
        try:
            await self.db.initialize()
        except Exception:
            pass  # Already initialized
        
        # Validate input - get fresh config values
        config = self.config_loader.get_config()
        
        max_length = config.get("translation", {}).get("max_text_length", 10000)
        if len(text) > max_length:
            raise ValueError(f"Text too long. Maximum length: {max_length} characters")
        
        max_langs = config.get("translation", {}).get("max_target_languages", 10)
        if len(target_languages) > max_langs:
            raise ValueError(f"Too many target languages. Maximum: {max_langs}")
        
        # Detect source language if not provided
        if not source_language:
            source_language = await self.lang_detector.execute(text)
        
        # Use ROMA for intelligent parallel translation
        try:
            roma_result = await self.roma.translate(
                text=text,
                source_lang=source_language,
                target_languages=target_languages
            )
            
            translations = roma_result.get("translations", {})
            execution_mode = roma_result.get("execution_mode", "unknown")
            
            # Log ROMA execution mode
            if execution_mode == "parallel_roma":
                print(f"✨ ROMA parallel execution: {roma_result.get('successful_count')}/{len(target_languages)} translations")
        
        except Exception as e:
            # Fallback to direct translation if ROMA fails
            print(f"⚠️  ROMA failed, using direct translation: {e}")
            translations = await self._direct_translate(
                text, source_language, target_languages
            )
        
        # Preserve formatting if requested
        if preserve_formatting:
            translations = await self.format_preserver.execute(text, translations)
        
        # Calculate quality scores
        quality_scores = await self.quality_checker.execute(
            text, translations, source_language
        )
        
        # Save translations to database
        for lang, translation in translations.items():
            quality = quality_scores.get(lang, 0.0)
            await self.db.save_translation(
                text, source_language, lang, translation, quality
            )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "request_id": str(uuid.uuid4()),
            "source_language": source_language,
            "translations": translations,
            "quality_scores": quality_scores,
            "processing_time_ms": processing_time,
            "cached": self._check_if_cached(text, source_language, target_languages),
            "metadata": {
                "provider": "Multi-Provider (DeepL/Azure/LibreTranslate)",
                "parallel_execution": len(target_languages) > 1,
                "roma_enabled": True
            }
        }
    
    async def _direct_translate(
        self,
        text: str,
        source_language: str,
        target_languages: List[str]
    ) -> Dict[str, str]:
        """
        Direct translation without ROMA (fallback)
        
        Args:
            text: Text to translate
            source_language: Source language
            target_languages: Target languages
        
        Returns:
            Dictionary of translations
        """
        # Parallel translation
        tasks = [
            self.translation_executor.execute(text, source_language, lang)
            for lang in target_languages
        ]
        
        results = await asyncio.gather(*tasks)
        
        return {
            lang: result
            for lang, result in zip(target_languages, results)
        }
    
    async def detect_language(self, text: str) -> str:
        """Detect language of text"""
        return await self.lang_detector.execute(text)
    
    def _check_if_cached(
        self,
        text: str,
        source_lang: str,
        target_languages: List[str]
    ) -> bool:
        """Check if translation is cached"""
        for lang in target_languages:
            if self.cache.get(text, source_lang, lang):
                return True
        return False
    
    def get_stats(self) -> Dict:
        """Get bot statistics"""
        return {
            "cache": self.cache.get_stats(),
            "translation_service": self.translation_service.get_stats(),
            "database": "connected" if self.db else "not connected"
        }

