#!/usr/bin/env python3
"""Run the Telegram bot"""

from dotenv import load_dotenv
from src.bots.telegram_bot import TranslationTelegramBot
from src.core.config_loader import get_config_loader

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Force reload config to pick up any changes
    config_loader = get_config_loader()
    config_loader.reload_config()
    print("✅ Configuration reloaded")
    
    print("🚀 Starting Telegram Translation Bot...")
    bot = TranslationTelegramBot()
    bot.run()

