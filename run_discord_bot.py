#!/usr/bin/env python3
"""Run the Discord bot"""

from dotenv import load_dotenv
from src.bots.discord_bot import TranslationDiscordBot
from src.core.config_loader import get_config_loader

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    print("🚀 Starting Discord Translation Bot...")
    
    # Force reload config to pick up any changes
    config_loader = get_config_loader()
    config_loader.reload_config()
    print("✅ Configuration reloaded")
    
    bot = TranslationDiscordBot()
    bot.run()

