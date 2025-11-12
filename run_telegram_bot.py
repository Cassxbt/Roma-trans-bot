#!/usr/bin/env python3
"""Run the Telegram bot with graceful shutdown"""

import signal
import sys
import asyncio
from dotenv import load_dotenv
from src.bots.telegram_bot import TranslationTelegramBot
from src.core.config_loader import get_config_loader
from src.utils.logger import get_logger

# Load environment variables
load_dotenv()

logger = get_logger("run_telegram_bot")

# Global bot reference for shutdown
_bot = None


def signal_handler(sig, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {sig}. Initiating graceful shutdown...")
    
    if _bot:
        try:
            logger.info("Stopping Telegram bot...")
            # Stop the bot application
            _bot.application.stop()
            logger.info("Telegram bot stopped successfully")
        except Exception as e:
            logger.error(f"Error stopping bot: {e}")
    
    logger.info("Telegram bot shutdown complete")
    sys.exit(0)


def main():
    """Main entry point"""
    global _bot
    
    logger.info("🚀 Starting Telegram Translation Bot...")
    
    # Force reload config to pick up any changes
    config_loader = get_config_loader()
    config_loader.reload_config()
    logger.info("✅ Configuration reloaded")
    
    _bot = TranslationTelegramBot()
    logger.info("✅ Telegram bot initialized")
    
    try:
        logger.info("Starting Telegram bot polling...")
        _bot.application.run_polling(allowed_updates=None)
    except Exception as e:
        logger.error(f"Fatal error in Telegram bot: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    logger.info("Signal handlers registered for graceful shutdown")
    
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
        signal_handler(signal.SIGINT, None)
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        sys.exit(1)

