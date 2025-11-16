"""
Telegram Bot

Telegram bot integration for translation
"""

import os
import re
import asyncio
import tempfile
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from .bot_handlers import BotTranslationHandler
from ..utils.sentry_integration import init_sentry
from ..utils.logger import get_logger

logger = get_logger("telegram_bot")


class TranslationTelegramBot:
    """Telegram bot for translation"""
    
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not self.token:
            raise ValueError("TELEGRAM_BOT_TOKEN not found in environment variables")

        # Initialize Sentry for error tracking
        sentry_dsn = os.getenv("SENTRY_TELEGRAM_DSN")
        if sentry_dsn:
            init_sentry(dsn=sentry_dsn, service_name="telegram")
            logger.info("✅ Sentry error tracking initialized")
        else:
            logger.warning("⚠️  Sentry not configured. Error tracking disabled.")

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
        from ..utils.logger import get_logger as get_setup_logger
        setup_logger = get_setup_logger("setup_handlers")
        
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

*Voice Translation:*
🎙️ Just send a voice message! (auto-translates)
`/voicetrans spanish french korean` - Set target languages

*Other Commands:*
`/detect <text>` - Detect language
`/start` - Welcome message

*Features:*
✅ Up to 10 languages simultaneously
✅ Natural language parsing
✅ Voice transcription & translation
✅ Multi-provider (DeepL, Azure, LibreTranslate)
✅ ROMA parallel execution
✅ Clean, professional output

*Popular Languages:*
Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Korean, Arabic, Dutch, Polish, Turkish, Vietnamese, Hindi
            """
            await update.message.reply_text(help_text, parse_mode='Markdown')
        
        async def voicetrans_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /voicetrans command to set target languages"""
            if not context.args:
                await update.message.reply_text(
                    "🎙️ *Voice Translation*\n\n"
                    "Usage: `/voicetrans spanish french korean`\n"
                    "Then send a voice message!\n\n"
                    "Supported: spanish, french, german, italian, portuguese, russian, japanese, chinese, korean, arabic, dutch, polish, english, hindi, turkish, vietnamese",
                    parse_mode='Markdown'
                )
            else:
                langs = ', '.join(context.args)
                context.user_data['voice_target_languages'] = context.args
                await update.message.reply_text(
                    f"✅ *Target languages set:* {langs}\n\n"
                    "Now send me a voice message!",
                    parse_mode='Markdown'
                )
        
        async def voice_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle incoming voice messages"""
            from ..utils.logger import get_logger as get_handler_logger
            handler_logger = get_handler_logger("voice_handler")
            
            handler_logger.info(f"🎙️ Voice message handler STARTED for user {update.effective_user.id}")
            handler_logger.info(f"Message type: {type(update.message)}, has voice: {hasattr(update.message, 'voice')}")
            
            audio_path = None
            try:
                # Double-check voice exists
                if not update.message or not update.message.voice:
                    handler_logger.error(f"❌ NO VOICE: update.message={update.message}, voice={getattr(update.message, 'voice', 'NO ATTR')}")
                    try:
                        await update.message.reply_text("❌ No voice detected", parse_mode='Markdown')
                    except Exception as e:
                        handler_logger.error(f"Failed to send no-voice message: {e}")
                    return
                
                voice = update.message.voice
                handler_logger.info(f"✅ Voice detected: {voice.duration}s, file_id={voice.file_id}")
                
                # Get target languages - try persistent storage first
                if 'voice_target_languages' not in context.user_data:
                    handler_logger.info("No voice_target_languages in context, using defaults")
                    context.user_data['voice_target_languages'] = ['spanish', 'french', 'korean']
                
                target_langs_input = context.user_data.get('voice_target_languages', ['spanish', 'french', 'korean'])
                
                # Map language names to codes
                lang_map = {
                    'spanish': 'es', 'french': 'fr', 'german': 'de', 'italian': 'it',
                    'portuguese': 'pt', 'russian': 'ru', 'japanese': 'ja', 'chinese': 'zh',
                    'korean': 'ko', 'arabic': 'ar', 'dutch': 'nl', 'polish': 'pl',
                    'english': 'en', 'hindi': 'hi', 'turkish': 'tr', 'vietnamese': 'vi'
                }
                
                target_langs = []
                for lang in target_langs_input:
                    lang_lower = lang.lower()
                    if lang_lower in lang_map:
                        target_langs.append(lang_map[lang_lower])
                    elif len(lang_lower) == 2:
                        target_langs.append(lang_lower)
                
                if not target_langs:
                    target_langs = ['es', 'fr', 'ko']  # Fallback
                
                handler_logger.info(f"Target languages: {target_langs}")
                
                # Notify user
                try:
                    await update.message.reply_text("🎙️ *Transcribing your voice message...*", parse_mode='Markdown')
                    handler_logger.info("✅ Sent transcribing notification")
                except Exception as e:
                    handler_logger.error(f"Failed to send transcribing notification: {e}")
                
                # Download voice file
                handler_logger.info("📥 Downloading voice file...")
                try:
                    voice_file = await voice.get_file()
                    handler_logger.info(f"✅ Voice file obtained: {voice_file.file_id}")
                except Exception as e:
                    handler_logger.error(f"❌ Failed to get voice file: {e}", exc_info=True)
                    await update.message.reply_text(f"❌ Failed to download voice: {str(e)[:50]}", parse_mode='Markdown')
                    return
                
                # Save to temporary file
                try:
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.ogg') as tmp:
                        await voice_file.download_to_drive(tmp.name)
                        audio_path = tmp.name
                        handler_logger.info(f"✅ Saved audio: {audio_path} ({os.path.getsize(audio_path)} bytes)")
                except Exception as e:
                    handler_logger.error(f"❌ Failed to save audio: {e}", exc_info=True)
                    await update.message.reply_text(f"❌ Failed to save audio: {str(e)[:50]}", parse_mode='Markdown')
                    return
                
                # Handle voice translation
                handler_logger.info(f"🔄 Starting translation: audio={audio_path}, langs={target_langs}")
                try:
                    result = await self.handler.handle_voice_translation(
                        audio_path=audio_path,
                        target_languages=target_langs
                    )
                    handler_logger.info(f"✅ Translation pipeline complete: success={result.get('success')}")
                except Exception as e:
                    handler_logger.error(f"❌ Translation pipeline exception: {e}", exc_info=True)
                    await update.message.reply_text(f"❌ Translation failed: {str(e)[:100]}", parse_mode='Markdown')
                    return
                
                if not result.get('success'):
                    error_msg = result.get('error', 'Unknown error')
                    handler_logger.error(f"❌ Translation failed: {error_msg}")
                    try:
                        await update.message.reply_text(f"❌ *Translation Error:* {error_msg[:100]}", parse_mode='Markdown')
                    except Exception as e:
                        handler_logger.error(f"Failed to send error message: {e}")
                    return
                
                # Format and send response
                try:
                    response = self.handler.format_voice_translation_response(result)
                    handler_logger.info(f"📤 Formatted response: {len(response)} chars")
                    await update.message.reply_text(response, parse_mode='Markdown')
                    handler_logger.info("✅✅✅ VOICE TRANSLATION COMPLETE ✅✅✅")
                except Exception as e:
                    handler_logger.error(f"❌ Failed to send final response: {e}", exc_info=True)
                    try:
                        await update.message.reply_text(f"❌ Failed to format response: {str(e)[:50]}", parse_mode='Markdown')
                    except:
                        handler_logger.error("Could not send any error message")
            
            except Exception as e:
                handler_logger.error(f"❌ Voice handler exception: {e}", exc_info=True)
                try:
                    error_msg = f"❌ *Voice Translation Error:* {str(e)[:100]}"
                    handler_logger.info(f"Sending error message: {error_msg}")
                    await update.message.reply_text(error_msg, parse_mode='Markdown')
                except Exception as send_err:
                    handler_logger.error(f"Failed to send error message: {send_err}", exc_info=True)
            
            finally:
                # Clean up temporary file
                if audio_path and os.path.exists(audio_path):
                    try:
                        os.unlink(audio_path)
                        handler_logger.info(f"Cleaned up: {audio_path}")
                    except Exception as e:
                        handler_logger.warning(f"Failed to cleanup {audio_path}: {e}")
        
        # Register handlers
        setup_logger.info("📝 Registering command handlers...")
        self.application.add_handler(CommandHandler("start", start))
        self.application.add_handler(CommandHandler("translate", translate_command))
        self.application.add_handler(CommandHandler("detect", detect_command))
        self.application.add_handler(CommandHandler("languages", languages_command))
        self.application.add_handler(CommandHandler("voicetrans", voicetrans_command))
        self.application.add_handler(CommandHandler("help", help_command))
        
        # Register voice handler - CRITICAL
        setup_logger.info("🎙️ Registering VOICE message handler with filters.VOICE...")
        self.application.add_handler(MessageHandler(filters.VOICE, voice_message_handler))
        setup_logger.info("✅ Voice handler registered successfully")
    
    def run(self):
        """Run the Telegram bot"""
        logger.info("🤖 Starting Telegram bot...")
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    bot = TranslationTelegramBot()
    bot.run()

