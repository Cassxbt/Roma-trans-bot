"""
Bot Handlers

Shared translation handlers for Discord and Telegram bots
"""

import os
import asyncio
import tempfile
from typing import Dict, List
from ..core.translation_agent import TranslationBot
from ..services.hf_whisper_service import HFWhisperASR


class BotTranslationHandler:
    """Shared translation handler for bots"""
    
    def __init__(self):
        self.bot = TranslationBot()
        self.asr = HFWhisperASR(enable_cache=True)
    
    async def handle_translate_command(
        self,
        text: str,
        target_languages: List[str],
        source_language: str = None
    ) -> Dict:
        """
        Handle translation command from bot
        
        Args:
            text: Text to translate
            target_languages: Target languages
            source_language: Source language (optional)
        
        Returns:
            Translation result dictionary
        """
        try:
            result = await self.bot.translate(
                text=text,
                target_languages=target_languages,
                source_language=source_language
            )
            return result
        except Exception as e:
            return {
                "error": str(e),
                "success": False
            }
    
    def format_translation_response(self, result: Dict) -> str:
        """
        Format translation result for bot message - Clean and professional
        
        Args:
            result: Translation result dictionary
        
        Returns:
            Formatted message string
        """
        if result.get("error"):
            return f"❌ {result['error']}"
        
        # Clean output - just show translations
        response = ""
        translations = result.get('translations', {})
        
        # If single language, show without label
        if len(translations) == 1:
            lang, translation = list(translations.items())[0]
            response = f"🇫🇷 {translation}" if lang == 'fr' else f"🌍 {translation}"
        else:
            # Multiple languages - show with flags/labels
            lang_flags = {
                'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
                'pt': '🇵🇹', 'ru': '🇷🇺', 'ja': '🇯🇵', 'zh': '🇨🇳',
                'ko': '🇰🇷', 'ar': '🇸🇦', 'nl': '🇳🇱', 'pl': '🇵🇱'
            }
            
            for lang, translation in translations.items():
                flag = lang_flags.get(lang.lower(), '🌍')
                response += f"{flag} **{lang.upper()}**: {translation}\n"
        
        return response.strip()
    
    async def handle_detect_command(self, text: str) -> str:
        """Handle language detection command"""
        try:
            lang = await self.bot.detect_language(text)
            return f"Detected language: **{lang}**"
        except Exception as e:
            return f"❌ Error: {str(e)}"
    
    async def handle_voice_transcription(self, audio_path: str) -> Dict:
        """
        Handle voice transcription
        
        Args:
            audio_path: Path to audio file
        
        Returns:
            Transcription result dictionary
        """
        try:
            # Run blocking transcription in thread pool to avoid blocking async event loop
            result = await asyncio.to_thread(self.asr.transcribe_with_retry, audio_path)
            return result
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "text": ""
            }
    
    async def handle_voice_translation(
        self,
        audio_path: str,
        target_languages: List[str],
        source_language: str = None
    ) -> Dict:
        """
        Handle complete voice-to-translation pipeline
        
        Args:
            audio_path: Path to audio file
            target_languages: Target language codes
            source_language: Optional source language code
        
        Returns:
            Combined transcription and translation result
        """
        import os
        from ..utils.logger import get_logger
        
        logger = get_logger("voice_handler")
        
        try:
            
            # Validate audio file exists
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            file_size = os.path.getsize(audio_path)
            logger.info(f"📋 Voice translation starting: {audio_path} ({file_size} bytes)")
            
            # Step 1: Transcribe audio (run in thread pool to avoid blocking)
            logger.info(f"🎙️ Starting transcription...")
            asr_result = await asyncio.to_thread(self.asr.transcribe_with_retry, audio_path)
            
            if not asr_result.get("success"):
                error = asr_result.get("error", "Transcription failed")
                logger.error(f"❌ Transcription failed: {error}")
                return {
                    "success": False,
                    "error": error,
                    "text": ""
                }
            
            transcribed_text = asr_result["text"]
            cached = asr_result.get("cached", False)
            logger.info(f"✅ Transcribed: '{transcribed_text[:60]}...' (cached={cached})")
            
            # Step 2: Translate text
            logger.info(f"🌐 Starting translation to {len(target_languages)} languages...")
            translation_result = await self.bot.translate(
                text=transcribed_text,
                target_languages=target_languages,
                source_language=source_language
            )
            
            if translation_result.get("error"):
                error = translation_result["error"]
                logger.error(f"❌ Translation failed: {error}")
                return {
                    "success": False,
                    "error": error,
                    "text": ""
                }
            
            # Combine results
            translations = translation_result.get("translations", {})
            logger.info(f"✅ Translation complete: {len(translations)} languages translated")
            
            return {
                "success": True,
                "transcribed_text": transcribed_text,
                "source_language": translation_result.get("source_language"),
                "translations": translations,
                "quality_scores": translation_result.get("quality_scores", {}),
                "cached": cached
            }
        
        except FileNotFoundError as e:
            logger.error(f"❌ File error: {str(e)}")
            return {
                "success": False,
                "error": f"File error: {str(e)}",
                "text": ""
            }
        except Exception as e:
            import traceback
            logger.error(f"❌ Unexpected error: {str(e)}\n{traceback.format_exc()}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "text": ""
            }
    
    def format_voice_translation_response(self, result: Dict) -> str:
        """
        Format voice translation result for bot message
        
        Args:
            result: Voice translation result
        
        Returns:
            Formatted message string
        """
        if not result.get("success"):
            return f"❌ {result.get('error', 'Unknown error')}"
        
        # Format response
        response = f"📝 **You said:** {result.get('transcribed_text', '')}\n\n"
        response += "**Translations:**\n"
        
        lang_flags = {
            'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
            'pt': '🇵🇹', 'ru': '🇷🇺', 'ja': '🇯🇵', 'zh': '🇨🇳',
            'ko': '🇰🇷', 'ar': '🇸🇦', 'nl': '🇳🇱', 'pl': '🇵🇱',
            'tr': '🇹🇷', 'vi': '🇻🇳', 'hi': '🇮🇳'
        }
        
        translations = result.get("translations", {})
        for lang, translation in translations.items():
            flag = lang_flags.get(lang.lower(), '🌍')
            response += f"{flag} **{lang.upper()}:** {translation}\n"
        
        cached_status = "✅ Yes (instant)" if result.get("cached") else "❌ No (fresh)"
        response += f"\n💾 **Cached:** {cached_status}"
        
        return response.strip()

