"""
Discord Bot

Discord bot integration for translation
"""

import os
import re
import discord
import tempfile
from discord.ext import commands
from .bot_handlers import BotTranslationHandler
from ..utils.logger import get_logger
from ..utils.sentry_integration import init_sentry

logger = get_logger("discord_bot")


class TranslationDiscordBot:
    """Discord bot for translation"""
    
    def __init__(self):
        self.token = os.getenv("DISCORD_BOT_TOKEN")
        if not self.token:
            logger.error("DISCORD_BOT_TOKEN not found in environment variables")
            raise ValueError("DISCORD_BOT_TOKEN not found in environment variables")

        logger.info("Initializing Discord bot")

        # Initialize Sentry for error tracking
        sentry_dsn = os.getenv("SENTRY_DISCORD_DSN")
        if sentry_dsn:
            init_sentry(dsn=sentry_dsn, service_name="discord")
            logger.info("✅ Sentry error tracking initialized")
        else:
            logger.warning("⚠️  Sentry not configured. Error tracking disabled.")

        # Configure intents for full bot functionality
        intents = discord.Intents.default()
        intents.message_content = True  # For reading message content in commands
        intents.guilds = True            # For guild/server events
        intents.members = True           # For member join/leave events
        intents.messages = True          # For message events
        intents.dm_messages = True       # For DM support
        
        logger.info(f"🔐 Discord Intents configured: message_content={intents.message_content}, guilds={intents.guilds}, members={intents.members}")

        self.bot = commands.Bot(command_prefix='!', intents=intents)
        self.handler = BotTranslationHandler()

        self._setup_commands()
    
    def _parse_natural_language(self, text: str):
        """Parse natural language translation request
        
        Supports formats:
        - "hello" to French
        - "hello" to French and Spanish
        - "hello" in French
        - hello --to es fr (classic)
        """
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
        # Use greedy match and look for language keywords at the end
        # This handles: "I want to say hello to you to French" correctly
        
        # First, try to find language names/codes at the end
        text_lower = text.lower()
        
        # Find the last occurrence of " to " or " in " followed by language names
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
    
    def _setup_commands(self):
        """Setup bot commands"""
        
        @self.bot.event
        async def on_ready():
            logger.info(f'✅ Discord bot logged in as {self.bot.user}')
        
        @self.bot.event
        async def on_message(message):
            """Auto-transcribe voice messages when sent in any channel"""
            # Ignore bot's own messages
            if message.author == self.bot.user:
                return
            
            # Check if message has voice message attachment
            if message.attachments:
                for attachment in message.attachments:
                    # Discord voice messages have audio/* content type
                    if attachment.content_type and attachment.content_type.startswith('audio/'):
                        logger.info(f"🎤 Auto-detected voice message from {message.author.name}: {attachment.filename}")
                        
                        # Send processing message
                        processing_msg = await message.channel.send("🎙️ Transcribing your voice message...")
                        
                        audio_path = None
                        try:
                            # Download audio - read entire file into memory first
                            audio_data = await attachment.read()
                            logger.info(f"📥 Downloaded {len(audio_data)} bytes from Discord")
                            
                            tmp_file = tempfile.NamedTemporaryFile(
                                suffix=os.path.splitext(attachment.filename)[1],
                                delete=False
                            )
                            audio_path = tmp_file.name
                            tmp_file.write(audio_data)
                            tmp_file.close()
                            
                            file_size = os.path.getsize(audio_path)
                            logger.info(f"📥 Voice message saved to: {audio_path} ({file_size} bytes)")
                            
                            # Get user's preferred languages or use defaults
                            user_langs = getattr(self.bot, 'voice_langs', {}).get(message.author.id)
                            target_langs = user_langs if user_langs else ["es", "fr", "ko"]
                            logger.info(f"🔄 Starting voice translation pipeline with langs: {target_langs}")
                            
                            result = await self.handler.handle_voice_translation(
                                audio_path=audio_path,
                                target_languages=target_langs
                            )
                            
                            logger.info(f"✅ Translation result: success={result.get('success')}")
                            
                            # Format and send response
                            response = self.handler.format_voice_translation_response(result)
                            
                            if len(response) > 2000:
                                logger.warning(f"Response too long ({len(response)} chars), splitting")
                                chunks = [response[i:i+1900] for i in range(0, len(response), 1900)]
                                for idx, chunk in enumerate(chunks, 1):
                                    if idx == 1:
                                        await processing_msg.edit(content=chunk)
                                    else:
                                        await message.channel.send(chunk)
                            else:
                                await processing_msg.edit(content=response)
                            
                            logger.info(f"✅ Voice message processed")
                        
                        except Exception as e:
                            logger.error(f"❌ Voice message error: {str(e)}", exc_info=True)
                            error_msg = f"❌ Error processing voice: {str(e)[:100]}"
                            try:
                                await processing_msg.edit(content=error_msg)
                            except:
                                await message.channel.send(error_msg)
                        
                        finally:
                            if audio_path and os.path.exists(audio_path):
                                try:
                                    os.unlink(audio_path)
                                    logger.info(f"🗑️  Cleaned up: {audio_path}")
                                except Exception as e:
                                    logger.warning(f"Could not delete temp file: {e}")
            
            # Process commands normally
            await self.bot.process_commands(message)
        
        @self.bot.command(name='translate', aliases=['t', 'tr'])
        async def translate_command(ctx, *, text: str = None):
            """Translate text naturally
            
            Examples:
              !translate hello to French
              !translate "good morning" to Spanish and German
              !translate bonjour in English
              !translate hello --to es fr de (classic format)
            """
            if not text:
                await ctx.send("❌ Please provide text to translate.\n"
                             "Example: `!translate hello to French`")
                return
            
            # Parse natural language command
            parsed = self._parse_natural_language(text)
            
            if not parsed:
                await ctx.send("❌ Could not understand request.\n"
                             "Try: `!translate hello to French` or `!translate hello --to es fr`")
                return
            
            source_text, target_langs = parsed
            
            # Show typing indicator
            async with ctx.typing():
                result = await self.handler.handle_translate_command(
                    source_text,
                    target_langs
                )
            
            response = self.handler.format_translation_response(result)
            
            # Discord has 2000 character limit, split if needed
            if len(response) > 2000:
                chunks = [response[i:i+1900] for i in range(0, len(response), 1900)]
                for chunk in chunks:
                    await ctx.send(chunk)
            else:
                await ctx.send(response)
        
        @self.bot.command(name='detect', aliases=['lang', 'detect-lang'])
        async def detect_command(ctx, *, text: str = None):
            """Detect language of text
            
            Usage: !detect <text>
            """
            if not text:
                await ctx.send("❌ Please provide text to detect language for.")
                return
            
            async with ctx.typing():
                result = await self.handler.handle_detect_command(text)
            
            await ctx.send(result)
        
        @self.bot.command(name='languages', aliases=['langs', 'supported'])
        async def languages_command(ctx):
            """List supported languages"""
            from ..core.config_loader import get_config_loader
            
            config_loader = get_config_loader()
            languages_dict = config_loader.get_languages()
            
            response = "**Supported Languages:**\n\n"
            for code, info in list(languages_dict.items())[:20]:  # Limit to 20 for Discord
                response += f"`{code}` - {info.get('name', code)}\n"
            
            await ctx.send(response)
        
        @self.bot.command(name='voicetrans', aliases=['vt', 'voice'])
        async def voice_translate_command(ctx, *languages):
            """
            🎙️ Transcribe voice message and translate
            Usage: !voicetrans chinese french korean (attach audio)
            """
            logger.info(f"🎙️ Voice translation command received from {ctx.author.name}")
            
            # Discord voice messages come as attachments
            if not ctx.message.attachments:
                logger.warning(f"No attachments provided by {ctx.author.name}")
                await ctx.send("❌ Please attach an audio file or send a voice message!\n\n"
                             "Supported formats: WAV, MP3, M4A, FLAC, OGG, OPUS")
                return
            
            attachment = ctx.message.attachments[0]
            
            # Check if it's a valid audio format (includes voice messages which are .ogg files)
            valid_formats = ('.wav', '.mp3', '.m4a', '.flac', '.ogg', '.opus', '.webm')
            is_audio = attachment.filename.lower().endswith(valid_formats) or attachment.content_type.startswith('audio/')
            
            if not is_audio:
                logger.error(f"Invalid format: {attachment.filename} (content_type: {attachment.content_type})")
                await ctx.send(f"❌ Invalid format. Use: WAV, MP3, M4A, FLAC, OGG, OPUS, WEBM")
                return
            
            logger.info(f"📎 Audio attachment received: {attachment.filename} ({attachment.size} bytes, type: {attachment.content_type})")
            
            # Default languages if none specified
            if not languages:
                languages = ["spanish", "french", "korean"]
            
            # Convert language names to codes
            lang_map = {
                'spanish': 'es', 'french': 'fr', 'german': 'de', 'italian': 'it',
                'portuguese': 'pt', 'russian': 'ru', 'japanese': 'ja', 'chinese': 'zh',
                'korean': 'ko', 'arabic': 'ar', 'dutch': 'nl', 'polish': 'pl',
                'english': 'en', 'hindi': 'hi', 'turkish': 'tr', 'vietnamese': 'vi'
            }
            
            target_langs = []
            for lang in languages:
                lang_lower = lang.lower()
                # Check if it's a language name
                if lang_lower in lang_map:
                    target_langs.append(lang_map[lang_lower])
                # Check if it's already a 2-letter code
                elif len(lang_lower) == 2:
                    target_langs.append(lang_lower)
            
            if not target_langs:
                target_langs = ["es", "fr", "ko"]  # Default fallback
            
            logger.info(f"🎯 Target languages: {target_langs}")
            
            # Processing message
            processing_msg = await ctx.send("🎙️ Transcribing your voice message...")
            
            audio_path = None
            try:
                # Download audio - read entire file into memory first
                audio_data = await attachment.read()
                logger.info(f"📥 Downloaded {len(audio_data)} bytes from Discord")
                
                tmp_file = tempfile.NamedTemporaryFile(
                    suffix=os.path.splitext(attachment.filename)[1],
                    delete=False
                )
                audio_path = tmp_file.name
                tmp_file.write(audio_data)
                tmp_file.close()
                
                file_size = os.path.getsize(audio_path)
                logger.info(f"📥 Audio saved to: {audio_path} ({file_size} bytes)")
                
                # Handle voice translation
                logger.info(f"🔄 Starting voice translation pipeline...")
                async with ctx.typing():
                    result = await self.handler.handle_voice_translation(
                        audio_path=audio_path,
                        target_languages=target_langs
                    )
                
                logger.info(f"✅ Translation result: success={result.get('success')}")
                
                # Format and send response
                response = self.handler.format_voice_translation_response(result)
                
                # Discord has 2000 character limit, split if needed
                if len(response) > 2000:
                    logger.warning(f"Response too long ({len(response)} chars), splitting into chunks")
                    chunks = [response[i:i+1900] for i in range(0, len(response), 1900)]
                    for idx, chunk in enumerate(chunks, 1):
                        try:
                            if idx == 1:
                                await processing_msg.edit(content=chunk)
                            else:
                                await ctx.send(chunk)
                        except Exception as e:
                            logger.error(f"Failed to send chunk {idx}: {e}")
                            await ctx.send(chunk)
                else:
                    try:
                        await processing_msg.edit(content=response)
                    except Exception as e:
                        logger.error(f"Failed to edit processing message: {e}")
                        await ctx.send(response)
                
                logger.info(f"✅✅✅ VOICE TRANSLATION COMPLETE ✅✅✅")
            
            except Exception as e:
                logger.error(f"❌ Voice translation error: {str(e)}", exc_info=True)
                error_msg = f"❌ Error: {str(e)}\n\nTroubleshooting:\n"
                error_msg += "• Check HF_TOKEN is set in .env\n"
                error_msg += "• Audio file might be corrupted\n"
                error_msg += "• HuggingFace API might be down\n"
                error_msg += "• You might be rate limited"
                try:
                    await processing_msg.edit(content=error_msg)
                except Exception as edit_err:
                    logger.warning(f"Failed to edit message: {edit_err}, trying send instead")
                    await ctx.send(error_msg)
            
            finally:
                # Clean up temporary file
                if audio_path and os.path.exists(audio_path):
                    try:
                        os.unlink(audio_path)
                        logger.info(f"🗑️  Cleaned up: {audio_path}")
                    except Exception as e:
                        logger.warning(f"Could not delete temp file: {e}")
        
        @self.bot.command(name='voicehelp')
        async def voice_help_command(ctx):
            """Show voice translation help"""
            embed = discord.Embed(
                title="🎙️ Voice Translation Commands",
                description="Send voice messages for instant translation",
                color=discord.Color.purple()
            )
            
            embed.add_field(
                name="📱 How to Use",
                value=(
                    "1. Record a voice message or upload audio file\n"
                    "2. Use: `!voicetrans spanish french korean`\n"
                    "3. Bot transcribes and translates automatically"
                ),
                inline=False
            )
            
            embed.add_field(
                name="🌍 Language Names",
                value="spanish, french, german, italian, portuguese, russian, japanese, chinese, korean, arabic, dutch, polish, english, hindi, turkish, vietnamese",
                inline=False
            )
            
            embed.add_field(
                name="🎵 Supported Formats",
                value="WAV, MP3, M4A, FLAC, OGG, OPUS, WEBM",
                inline=False
            )
            
            embed.add_field(
                name="💡 Tips",
                value=(
                    "• Keep audio under 30 seconds\n"
                    "• Speak clearly for best results\n"
                    "• First use takes 30-60s (then instant)\n"
                    "• Default: Spanish, French, Korean\n"
                    "• Use 2-letter codes: `!vt es fr de`"
                ),
                inline=False
            )
            
            await ctx.send(embed=embed)
        
        @self.bot.command(name='setlangs', aliases=['set-langs', 'langs-set'])
        async def set_languages_command(ctx, *languages):
            """Set your preferred voice translation languages
            
            Usage: !setlangs spanish french german
            These will be used for all future voice messages
            """
            if not languages:
                await ctx.send("❌ Please provide language names or codes.\n\n"
                             "Example: `!setlangs spanish french german`")
                return
            
            lang_map = {
                'spanish': 'es', 'french': 'fr', 'german': 'de', 'italian': 'it',
                'portuguese': 'pt', 'russian': 'ru', 'japanese': 'ja', 'chinese': 'zh',
                'korean': 'ko', 'arabic': 'ar', 'dutch': 'nl', 'polish': 'pl',
                'english': 'en', 'hindi': 'hi', 'turkish': 'tr', 'vietnamese': 'vi'
            }
            
            target_langs = []
            for lang in languages:
                lang_lower = lang.lower()
                if lang_lower in lang_map:
                    target_langs.append(lang_map[lang_lower])
                elif len(lang_lower) == 2:
                    target_langs.append(lang_lower)
            
            if not target_langs:
                await ctx.send("❌ No valid languages recognized")
                return
            
            # Store in context (in-memory for this session)
            ctx.bot.voice_langs = {ctx.author.id: target_langs}
            await ctx.send(f"✅ Voice translation languages set to: {', '.join(target_langs).upper()}\n\n"
                         f"Just send a voice message and I'll auto-transcribe!")
            logger.info(f"🎯 {ctx.author.name} set voice languages to: {target_langs}")
        
        @self.bot.command(name='help-translate', aliases=['help-t', 'h'])
        async def help_command(ctx):
            """Show translation bot help"""
            help_text = """
🌍 **ROMA Translation Bot**

**Natural Language Commands:**
`!translate hello to French`
`!translate "good morning" to Spanish and German`
`!translate bonjour in English`
`!translate hello --to es fr de` (classic format)

**Voice Translation:**
`!voicetrans spanish french korean` - Transcribe and translate audio (with specific languages)
`!setlangs spanish french german` - Set your preferred voice languages
`!voicehelp` - Show voice translation help

**Other Commands:**
`!detect <text>` - Detect language
`!languages` - List supported languages

**Supported Languages:**
Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Korean, Arabic, Dutch, Polish, English, Hindi, Turkish, Vietnamese

Powered by DeepL, Azure, LibreTranslate & Hugging Face Whisper 🚀
            """
            await ctx.send(help_text)
    
    def run(self):
        """Run the Discord bot"""
        self.bot.run(self.token)


async def start_discord_bot():
    """Start Discord bot (async entry point)"""
    bot = TranslationDiscordBot()
    await bot.bot.start(bot.token)


if __name__ == "__main__":
    bot = TranslationDiscordBot()
    bot.run()

