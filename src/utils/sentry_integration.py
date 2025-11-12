"""
Sentry Error Tracking Integration

Sets up Sentry for production error tracking, monitoring, and alerting.

Configuration:
  1. Set up free Sentry account at https://sentry.io (5k events/month free)
  2. Create a project for each app (Discord, Telegram, API)
  3. Get the DSN (Data Source Name)
  4. Add to .env file:
     SENTRY_DISCORD_DSN=https://xxx@xxx.ingest.sentry.io/xxx
     SENTRY_TELEGRAM_DSN=https://xxx@xxx.ingest.sentry.io/xxx
     SENTRY_API_DSN=https://xxx@xxx.ingest.sentry.io/xxx
"""

import os
import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from typing import Optional
from ..utils.logger import get_logger

logger = get_logger("sentry_integration")


def init_sentry(
    dsn: Optional[str] = None,
    service_name: str = "roma-translation-bot",
    environment: str = "production",
    traces_sample_rate: float = 0.1
) -> bool:
    """
    Initialize Sentry for error tracking
    
    Args:
        dsn: Sentry DSN (if None, tries to get from environment)
        service_name: Name of the service
        environment: Environment (production, staging, development)
        traces_sample_rate: Performance monitoring sample rate
    
    Returns:
        True if initialized successfully, False otherwise
    """
    if dsn is None:
        dsn = os.getenv(f"SENTRY_{service_name.upper()}_DSN")
    
    if not dsn:
        logger.warning(
            f"Sentry DSN not found for {service_name}. "
            "Error tracking disabled. "
            "To enable, set SENTRY_DSN environment variable."
        )
        return False
    
    try:
        # Set up Sentry with logging integration
        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            traces_sample_rate=traces_sample_rate,
            
            # Integrations
            integrations=[
                LoggingIntegration(
                    level=20,  # Capture INFO and above
                    event_level=50  # Send ERROR level events to Sentry
                ),
                AsyncioIntegration(),
            ],
            
            # Additional configuration
            attach_stacktrace=True,
            max_breadcrumbs=50,
            debug=environment != "production",
            
            # Before sending to Sentry
            before_send=_before_send_to_sentry,
        )
        
        logger.info(f"✅ Sentry initialized for {service_name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")
        return False


def _before_send_to_sentry(event, hint):
    """
    Filter or modify events before sending to Sentry
    
    Used to exclude certain errors or sensitive information.
    """
    # Exclude certain error types if needed
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        
        # Don't send KeyboardInterrupt
        if exc_type is KeyboardInterrupt:
            return None
        
        # Don't send SystemExit
        if exc_type is SystemExit:
            return None
    
    return event


def capture_exception(
    error: Exception,
    context: Optional[dict] = None,
    level: str = "error"
) -> Optional[str]:
    """
    Manually capture an exception in Sentry
    
    Args:
        error: Exception to capture
        context: Additional context data
        level: Error level (info, warning, error, fatal)
    
    Returns:
        Event ID if sent to Sentry, None otherwise
    """
    try:
        with sentry_sdk.push_scope() as scope:
            # Add context if provided
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            
            scope.set_level(level)
            event_id = sentry_sdk.capture_exception(error)
            
            logger.debug(f"Event captured in Sentry: {event_id}")
            return event_id
            
    except Exception as e:
        logger.error(f"Failed to capture exception in Sentry: {e}")
        return None


def capture_message(
    message: str,
    context: Optional[dict] = None,
    level: str = "info"
) -> Optional[str]:
    """
    Manually capture a message in Sentry
    
    Args:
        message: Message to capture
        context: Additional context data
        level: Message level (info, warning, error, fatal)
    
    Returns:
        Event ID if sent to Sentry, None otherwise
    """
    try:
        with sentry_sdk.push_scope() as scope:
            # Add context if provided
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            
            scope.set_level(level)
            event_id = sentry_sdk.capture_message(message)
            
            logger.debug(f"Message captured in Sentry: {event_id}")
            return event_id
            
    except Exception as e:
        logger.error(f"Failed to capture message in Sentry: {e}")
        return None


def set_user_context(user_id: str, username: Optional[str] = None):
    """
    Set user context for error tracking
    
    Args:
        user_id: Unique user identifier
        username: Optional username
    """
    sentry_sdk.set_user({
        "id": user_id,
        "username": username or "unknown"
    })


def set_tag(key: str, value: str):
    """Add a tag to the current scope"""
    sentry_sdk.set_tag(key, value)


def set_extra(key: str, value):
    """Add extra context data to the current scope"""
    sentry_sdk.set_context("extra", {key: value})


# Auto-initialize if DSN is available
_initialized = False


def get_sentry_status() -> dict:
    """Get Sentry initialization status"""
    return {
        "initialized": _initialized,
        "environment": os.getenv("ENVIRONMENT", "unknown"),
        "dsn_configured": bool(os.getenv("SENTRY_DISCORD_DSN") or 
                              os.getenv("SENTRY_TELEGRAM_DSN") or
                              os.getenv("SENTRY_API_DSN"))
    }


# Setup instructions for users
SENTRY_SETUP_INSTRUCTIONS = """
╔════════════════════════════════════════════════════════════════════════════╗
║                   SENTRY ERROR TRACKING SETUP GUIDE                        ║
╚════════════════════════════════════════════════════════════════════════════╝

1. CREATE SENTRY ACCOUNT
   • Go to https://sentry.io
   • Sign up for free (5k events/month included)
   • No credit card required

2. CREATE PROJECTS
   Create 3 separate projects for better organization:
   
   a) Discord Bot
      • Project name: "roma-translation-discord"
      • Platform: Python
   
   b) Telegram Bot
      • Project name: "roma-translation-telegram"
      • Platform: Python
   
   c) API Server
      • Project name: "roma-translation-api"
      • Platform: Python

3. GET DSN (Data Source Name)
   For each project:
   • Go to Settings → Client Keys (DSN)
   • Copy the DSN URL
   • Format: https://xxx@xxx.ingest.sentry.io/xxx

4. ADD TO .env FILE
   SENTRY_DISCORD_DSN=<your_discord_dsn>
   SENTRY_TELEGRAM_DSN=<your_telegram_dsn>
   SENTRY_API_DSN=<your_api_dsn>

5. OPTIONAL: ENABLE ALERTS
   In Sentry:
   • Go to Alerts
   • Create Alert Rule for "All Errors"
   • Select notification channel (Email, Slack, etc.)

6. OPTIONAL: CREATE TEAM
   In Sentry:
   • Add team members
   • Set up ownership rules
   • Configure notifications

7. MONITOR ERRORS
   • Dashboard shows error trends
   • Click on error to see details
   • View affected users, sessions, breadcrumbs

BENEFITS:
✓ Automatic error aggregation
✓ Real-time alerts
✓ Stack traces with source code
✓ User impact analysis
✓ Performance monitoring
✓ Free tier: 5k events/month

TROUBLESHOOTING:
• If errors aren't appearing:
  1. Check DSN is correct in .env
  2. Ensure sentry-sdk is installed: pip install sentry-sdk
  3. Restart the application
  4. Check Sentry project settings

For more help: https://docs.sentry.io/
"""
