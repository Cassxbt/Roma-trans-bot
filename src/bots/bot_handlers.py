"""
Bot Handlers

Shared translation handlers for Discord and Telegram bots
"""

from typing import Dict, List
from ..core.translation_agent import TranslationBot


class BotTranslationHandler:
    """Shared translation handler for bots"""
    
    def __init__(self):
        self.bot = TranslationBot()
    
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

