"""
Telegram Bot

Telegram bot integration for translation
"""

import os
import re
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from .bot_handlers import BotTranslationHandler


class TranslationTelegramBot:
    """Telegram bot for translation"""
    
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not self.token:
            raise ValueError("TELEGRAM_BOT_TOKEN not found in environment variables")
        
        self.handler = BotTranslationHandler()
        self.application = Application.builder().token(self.token).build()
        
        self._setup_handlers()
    
    def _parse_natural_language(self, text: str):
        """Parse natural language translation commands"""
        # Language name to code mapping
        lang_map = {
            'spanish': 'es', 'french': 'fr', 'german': 'de', 'italian': 'it',
            'portuguese': 'pt', 'russian': 'ru', 'japanese': 'ja', 'chinese': 'zh',
            'korean': 'ko', 'arabic': 'ar', 'dutch': 'nl', 'polish': 'pl',
            'english': 'en', 'hindi': 'hi', 'turkish': 'tr', 'vietnamese': 'vi'
        }
        
        # Valid 2-letter language codes
        valid_codes = {'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 
                      'ar', 'nl', 'pl', 'en', 'hi', 'tr', 'vi', 'sv', 'no', 
                      'da', 'fi', 'el', 'cs', 'sk', 'ro', 'bg', 'uk', 'id'}
        
        # Pattern 1: Classic format with --to
        if '--to' in text:
            parts = text.split('--to')
            source_text = parts[0].strip().strip('"').strip("'")
            target_langs = [lang.strip() for lang in parts[1].split() if lang.strip()]
            return (source_text, target_langs) if target_langs else None
        
        # Pattern 2: Natural language "to" or "in"
        # Find the last occurrence of " to " or " in " followed by language names
        text_lower = text.lower()
        
        last_to_match = None
        for match in re.finditer(r'\s+(?:to|in)\s+', text, re.IGNORECASE):
            # Check if what follows contains language names
            remaining = text[match.end():].lower()
            has_lang = any(lang in remaining for lang in lang_map.keys())
            has_code = any(code in remaining.split() for code in valid_codes)
            if has_lang or has_code:
                last_to_match = match
        
        if last_to_match:
            source_text = text[:last_to_match.start()].strip().strip('"').strip("'")
            lang_part = text[last_to_match.end():].strip()
            
            # Parse target languages (handle "French and Spanish", "French, Spanish", etc.)
            lang_part = lang_part.replace(' and ', ' ').replace(',', ' ')
            lang_words = [w.strip().lower() for w in lang_part.split() if w.strip()]
            
            target_langs = []
            for word in lang_words:
                # Check if it's a language name
                if word in lang_map:
                    target_langs.append(lang_map[word])
                # Check if it's a valid language code (not just any 2-letter word!)
                elif word in valid_codes:
                    target_langs.append(word)
            
            return (source_text, target_langs) if target_langs else None
        
        return None
    
    def _setup_handlers(self):
        """Setup bot command handlers"""
        
        async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Send a message when the command /start is issued."""
            await update.message.reply_text(
                "👋 Welcome to ROMA Translation Bot!\n\n"
                "🌍 Translate to multiple languages instantly!\n\n"
                "**Natural Language:**\n"
                "`/translate hello to Spanish French German`\n"
                "`/translate I love you to Korean Chinese Japanese`\n\n"
                "**Classic Format:**\n"
                "`/translate hello --to es fr de`\n\n"
                "**Other Commands:**\n"
                "/detect <text> - Detect language\n"
                "/help - Show all commands",
                parse_mode='Markdown'
            )
        
        async def translate_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /translate command with natural language parsing"""
            if not context.args:
                await update.message.reply_text(
                    "❌ Please provide text to translate.\n\n"
                    "**Examples:**\n"
                    "`/translate hello to Spanish French`\n"
                    "`/translate hello --to es fr`",
                    parse_mode='Markdown'
                )
                return
            
            text = ' '.join(context.args)
            
            # Try natural language parsing first
            parsed = self._parse_natural_language(text)
            
            if parsed:
                source_text, target_langs = parsed
            else:
                await update.message.reply_text(
                    "❌ Could not understand request.\n\n"
                    "Try: `/translate hello to French` or `/translate hello --to es fr`",
                    parse_mode='Markdown'
                )
                return
            
            # Show typing indicator
            await context.bot.send_chat_action(
                chat_id=update.effective_chat.id,
                action='typing'
            )
            
            result = await self.handler.handle_translate_command(
                source_text,
                target_langs
            )
            
            response = self.handler.format_translation_response(result)
            await update.message.reply_text(response, parse_mode='Markdown')
        
        async def detect_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /detect command"""
            if not context.args:
                await update.message.reply_text(
                    "❌ Please provide text to detect language for."
                )
                return
            
            text = ' '.join(context.args)
            
            await context.bot.send_chat_action(
                chat_id=update.effective_chat.id,
                action='typing'
            )
            
            result = await self.handler.handle_detect_command(text)
            await update.message.reply_text(result)
        
        async def languages_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /languages command"""
            from ..core.config_loader import get_config_loader
            
            config_loader = get_config_loader()
            languages_dict = config_loader.get_languages()
            
            response = "**Supported Languages:**\n\n"
            for code, info in languages_dict.items():
                response += f"`{code}` - {info.get('name', code)}\n"
            
            await update.message.reply_text(response, parse_mode='Markdown')
        
        async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /help command"""
            help_text = """
*🌍 ROMA Translation Bot*

*Natural Language Commands:*
`/translate hello to Spanish French German`
`/translate I love you to Korean Chinese`
`/translate good morning to French and Spanish`

*Classic Format:*
`/translate hello --to es fr de`
`/translate "good morning" --to es fr`

*Other Commands:*
`/detect <text>` - Detect language
`/start` - Welcome message

*Features:*
✅ Up to 10 languages simultaneously
✅ Natural language parsing
✅ Multi-provider (DeepL, Azure, LibreTranslate)
✅ ROMA parallel execution
✅ Clean, professional output

*Popular Languages:*
Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Korean, Arabic, Dutch, Polish, Turkish, Vietnamese, Hindi
            """
            await update.message.reply_text(help_text, parse_mode='Markdown')
        
        # Register handlers
        self.application.add_handler(CommandHandler("start", start))
        self.application.add_handler(CommandHandler("translate", translate_command))
        self.application.add_handler(CommandHandler("detect", detect_command))
        self.application.add_handler(CommandHandler("languages", languages_command))
        self.application.add_handler(CommandHandler("help", help_command))
    
    def run(self):
        """Run the Telegram bot"""
        print("🤖 Starting Telegram bot...")
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    bot = TranslationTelegramBot()
    bot.run()

