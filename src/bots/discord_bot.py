"""
Discord Bot

Discord bot integration for translation
"""

import os
import re
import discord
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

        intents = discord.Intents.default()
        intents.message_content = True

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
            print(f'✅ Discord bot logged in as {self.bot.user}')
        
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

**Other Commands:**
`!detect <text>` - Detect language
`!languages` - List supported languages

**Supported Languages:**
Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Korean, Arabic, Dutch, Polish, English, Hindi

Powered by DeepL, Azure & LibreTranslate 🚀
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

