"""
Translation Executor

Core translation logic using LLM service
"""

from typing import Optional
from .base import BaseExecutor
from ..services.translation_providers import MultiProviderTranslationService
from ..services.cache_service import SimpleCacheService
from ..services.database_service import DatabaseService


class TranslationExecutor(BaseExecutor):
    """Executes translation tasks"""
    
    def __init__(
        self,
        translation_service: MultiProviderTranslationService,
        cache_service: SimpleCacheService,
        db_service: DatabaseService
    ):
        self.translation_service = translation_service
        self.cache = cache_service
        self.db = db_service
    
    async def execute(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        use_cache: bool = True
    ) -> str:
        """
        Translate text from source to target language
        
        Args:
            text: Text to translate
            source_lang: Source language code
            target_lang: Target language code
            use_cache: Whether to use cache and translation memory
        
        Returns:
            Translated text
        """
        # Check cache first
        if use_cache:
            cached = self.cache.get(text, source_lang, target_lang)
            if cached:
                return cached
            
            # Check translation memory
            memory = await self.db.get_from_memory(text, source_lang, target_lang)
            if memory:
                # Update cache
                self.cache.set(text, source_lang, target_lang, memory)
                return memory
        
        # Translate with multi-provider service
        result = await self.translation_service.translate(text, source_lang, target_lang)
        translation = result['translation']
        
        # Cache and save
        if use_cache:
            self.cache.set(text, source_lang, target_lang, translation)
            await self.db.save_to_memory(text, source_lang, target_lang, translation)
        
        return translation

