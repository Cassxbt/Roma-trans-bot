"""
Translation Providers

Multi-provider translation service with automatic fallback
Supports: DeepL (primary), Azure Translator (fallback), LibreTranslate (emergency)

With built-in retry logic and error recovery.
"""

import os
import asyncio
from abc import ABC, abstractmethod
from typing import Optional, Dict, List
import httpx
from ..utils.logger import get_logger
from ..utils.error_recovery import retry_async, get_circuit_breaker, RetryStrategy

logger = get_logger("translation_providers")


class TranslationProvider(ABC):
    """Base class for translation providers"""
    
    def __init__(self):
        self.name = self.__class__.__name__
        self.usage_count = 0
        self.error_count = 0
    
    @abstractmethod
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate text from source to target language"""
        pass
    
    @abstractmethod
    def has_quota(self) -> bool:
        """Check if provider has available quota"""
        pass
    
    @abstractmethod
    def get_supported_languages(self) -> List[str]:
        """Get list of supported language codes"""
        pass


class DeepLProvider(TranslationProvider):
    """DeepL Translation Provider - Best Quality"""
    
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv("DEEPL_API_KEY")
        self.monthly_limit = 500000
        self.monthly_usage = 0
        
        if not self.api_key:
            logger.warning("⚠️  DeepL API key not found")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("✅ DeepL provider initialized (500k chars/month FREE)")
    
    
    @retry_async(
        max_retries=3,
        strategy=RetryStrategy.EXPONENTIAL,
        base_delay=1.0,
        max_delay=10.0,
        exceptions=(Exception,)
    )
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Translate using DeepL API with automatic retry
        
        Implements retry logic with exponential backoff for reliability.
        """
        if not self.enabled:
            logger.error("DeepL provider not enabled")
            raise Exception("DeepL provider not enabled")
        
        try:
            import deepl
            
            logger.debug(f"DeepL translating: {source_lang} → {target_lang}")
            
            translator = deepl.Translator(self.api_key)
            
            # Normalize language codes for DeepL
            target = self._normalize_target_lang(target_lang)
            source = self._normalize_source_lang(source_lang) if source_lang else None
            
            # DeepL API call - omit source_lang if None to let it auto-detect
            loop = asyncio.get_event_loop()
            if source:
                result = await loop.run_in_executor(
                    None,
                    lambda: translator.translate_text(text, source_lang=source, target_lang=target)
                )
            else:
                result = await loop.run_in_executor(
                    None,
                    lambda: translator.translate_text(text, target_lang=target)
                )
            
            self.usage_count += 1
            self.monthly_usage += len(text)
            logger.debug(f"DeepL translation successful: {target_lang}")
            return result.text
            
        except Exception as e:
            self.error_count += 1
            logger.error(f"DeepL translation failed: {str(e)}")
            raise Exception(f"DeepL translation failed: {str(e)}")
    
    def _normalize_source_lang(self, lang: str) -> str:
        """Normalize source language code for DeepL API"""
        # DeepL accepts specific 2-letter codes for source languages
        lang_code = lang.upper()[:2]
        
        # DeepL supported source languages
        supported_sources = ['BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'ES', 'ET', 'FI', 'FR', 
                           'HU', 'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB', 'NL', 'PL', 
                           'PT', 'RO', 'RU', 'SK', 'SL', 'SV', 'TR', 'UK', 'ZH']
        
        if lang_code not in supported_sources:
            # If not supported, let DeepL auto-detect (pass None)
            return None
        
        return lang_code
    
    def _normalize_target_lang(self, lang: str) -> str:
        """Normalize target language code for DeepL API"""
        lang = lang.upper()[:2]
        # DeepL requires EN-US or EN-GB for target, not just EN
        if lang == "EN":
            return "EN-US"
        # DeepL uses PT-BR or PT-PT for Portuguese target
        elif lang == "PT":
            return "PT-BR"
        return lang
    
    def has_quota(self) -> bool:
        if not self.enabled:
            return False
        return self.monthly_usage < self.monthly_limit
    
    def get_supported_languages(self) -> List[str]:
        return ['en', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'pl', 'ru', 'ja', 'zh', 'ko', 'tr']


class AzureTranslatorProvider(TranslationProvider):
    """Azure Translator - Most Generous Free Tier (2M chars/month)"""
    
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv("AZURE_TRANSLATOR_KEY")
        self.region = os.getenv("AZURE_TRANSLATOR_REGION", "global")
        self.endpoint = os.getenv("AZURE_TRANSLATOR_ENDPOINT", "https://api.cognitive.microsofttranslator.com")
        self.monthly_limit = 2000000
        self.monthly_usage = 0
        
        if not self.api_key:
            logger.warning("⚠️  Azure Translator API key not found")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("✅ Azure Translator initialized (2M chars/month FREE)")
    
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.enabled:
            raise Exception("Azure Translator not enabled")
        
        try:
            url = f"{self.endpoint}/translate"
            
            # Normalize language codes to 2-letter lowercase
            source_code = source_lang.lower()[:2] if source_lang else None
            target_code = self._normalize_azure_lang(target_lang)
            
            params = {
                'api-version': '3.0',
                'to': [target_code]  # Azure expects array of target languages
            }
            if source_code:
                params['from'] = source_code
            
            headers = {
                'Ocp-Apim-Subscription-Key': self.api_key,
                'Ocp-Apim-Subscription-Region': self.region,
                'Content-type': 'application/json',
                'X-ClientTraceId': str(id(text))  # Unique ID for tracking
            }
            body = [{'text': text}]
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, params=params, headers=headers, json=body, timeout=30.0)
                response.raise_for_status()
                result = response.json()
            
            self.usage_count += 1
            self.monthly_usage += len(text)
            return result[0]['translations'][0]['text']
        except httpx.HTTPStatusError as e:
            self.error_count += 1
            error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
            raise Exception(f"Azure translation failed (HTTP {e.response.status_code}): {error_detail}")
        except Exception as e:
            self.error_count += 1
            raise Exception(f"Azure translation failed: {str(e)}")
    
    def _normalize_azure_lang(self, lang: str) -> str:
        """Normalize language code for Azure API"""
        lang = lang.lower()[:2]
        # Azure uses specific codes for some languages
        lang_map = {
            'zh': 'zh-Hans',  # Simplified Chinese
            'pt': 'pt-br',    # Brazilian Portuguese
        }
        return lang_map.get(lang, lang)
    
    def has_quota(self) -> bool:
        if not self.enabled:
            return False
        return self.monthly_usage < self.monthly_limit
    
    def get_supported_languages(self) -> List[str]:
        return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar', 'hi', 'vi', 'tr']


class LibreTranslateProvider(TranslationProvider):
    """LibreTranslate - Free & Open Source (Emergency Fallback)"""
    
    def __init__(self):
        super().__init__()
        self.endpoint = os.getenv("LIBRETRANSLATE_ENDPOINT", "https://libretranslate.com")
        self.api_key = os.getenv("LIBRETRANSLATE_API_KEY", None)
        self.enabled = True
        logger.info(f"✅ LibreTranslate initialized (FREE)")
    
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        try:
            url = f"{self.endpoint}/translate"
            
            # Normalize language codes to 2-letter lowercase
            source_code = source_lang.lower()[:2] if source_lang else 'auto'
            target_code = target_lang.lower()[:2]
            
            payload = {
                'q': text,
                'source': source_code,
                'target': target_code,
                'format': 'text'
            }
            if self.api_key:
                payload['api_key'] = self.api_key
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=30.0)
                response.raise_for_status()
                result = response.json()
            
            self.usage_count += 1
            return result['translatedText']
        except httpx.HTTPStatusError as e:
            self.error_count += 1
            error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
            raise Exception(f"LibreTranslate failed (HTTP {e.response.status_code}): {error_detail}")
        except Exception as e:
            self.error_count += 1
            raise Exception(f"LibreTranslate failed: {str(e)}")
    
    def has_quota(self) -> bool:
        return True
    
    def get_supported_languages(self) -> List[str]:
        return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar', 'hi', 'vi', 'tr']


class MultiProviderTranslationService:
    """Unified translation service with automatic fallback"""
    
    def __init__(self):
        self.providers = [DeepLProvider(), AzureTranslatorProvider(), LibreTranslateProvider()]
        self.enabled_providers = [p for p in self.providers if p.has_quota()]
        
        if not self.enabled_providers:
            logger.warning("⚠️  No translation providers enabled!")
        else:
            logger.info("🌍 Translation Service Ready:")
            for i, provider in enumerate(self.enabled_providers, 1):
                logger.info(f"   {i}. {provider.name}")
    
    async def translate(self, text: str, source_lang: str, target_lang: str) -> Dict[str, any]:
        """Translate text with automatic provider fallback"""
        last_error = None
        
        for provider in self.enabled_providers:
            if not provider.has_quota():
                logger.warning(f"⚠️  {provider.name} quota exceeded, trying next provider...")
                continue
            
            try:
                translation = await provider.translate(text, source_lang, target_lang)
                return {
                    'translation': translation,
                    'provider': provider.name,
                    'source_lang': source_lang,
                    'target_lang': target_lang,
                    'success': True
                }
            except Exception as e:
                last_error = e
                logger.warning(f"⚠️  {provider.name} failed: {str(e)}")
                logger.info("Trying next provider...")
                continue
        
        raise Exception(f"All translation providers failed. Last error: {last_error}")
    
    def get_stats(self) -> Dict:
        """Get usage statistics for all providers"""
        stats = {}
        for provider in self.providers:
            stats[provider.name] = {
                'enabled': provider.has_quota(),
                'usage_count': provider.usage_count,
                'error_count': provider.error_count
            }
        return stats
