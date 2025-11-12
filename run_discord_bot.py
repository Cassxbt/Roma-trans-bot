#!/usr/bin/env python3
"""Run the Discord bot with graceful shutdown"""

import signal
import sys
import asyncio
from dotenv import load_dotenv
from src.bots.discord_bot import TranslationDiscordBot
from src.core.config_loader import get_config_loader
from src.utils.logger import get_logger

# Load environment variables
load_dotenv()

logger = get_logger("run_discord_bot")

# Global bot reference for shutdown
_bot = None


def signal_handler(sig, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {sig}. Initiating graceful shutdown...")
    
    if _bot:
        try:
            logger.info("Closing Discord bot connection...")
            # Schedule the close coroutine
            asyncio.create_task(_bot.bot.close())
            logger.info("Discord bot closed successfully")
        except Exception as e:
            logger.error(f"Error closing bot: {e}")
    
    logger.info("Discord bot shutdown complete")
    sys.exit(0)


async def main():
    """Main async entry point"""
    global _bot
    
    logger.info("🚀 Starting Discord Translation Bot...")
    
    # Force reload config to pick up any changes
    config_loader = get_config_loader()
    config_loader.reload_config()
    logger.info("✅ Configuration reloaded")
    
    _bot = TranslationDiscordBot()
    logger.info("✅ Discord bot initialized")
    
    try:
        await _bot.bot.start(get_bot_token())
    except Exception as e:
        logger.error(f"Fatal error in Discord bot: {e}", exc_info=True)
        raise


def get_bot_token():
    """Get bot token from environment"""
    import os
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        logger.error("DISCORD_BOT_TOKEN not found in environment variables")
        raise ValueError("DISCORD_BOT_TOKEN environment variable not set")
    return token


if __name__ == "__main__":
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    logger.info("Signal handlers registered for graceful shutdown")
    
    try:
        # Run the bot using asyncio
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
        signal_handler(signal.SIGINT, None)
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        sys.exit(1)

