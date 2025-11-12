#!/bin/bash
#
# PM2 Setup and Deployment Script
#
# Usage: bash scripts/pm2-startup.sh
#
# Sets up PM2 for production deployment with:
# - Auto-restart on crash
# - Graceful shutdown
# - Process monitoring
# - Log rotation
# - System startup on reboot
#

set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                   🚀 ROMA Translation Bot - PM2 Setup                      ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Installing PM2 globally..."
    npm install -g pm2
    echo "✅ PM2 installed successfully"
else
    echo "✅ PM2 already installed"
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    echo "📁 Creating logs directory..."
    mkdir -p logs
    echo "✅ Logs directory created"
else
    echo "✅ Logs directory exists"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Please copy .env.example to .env and configure it first."
    echo "   Required: DISCORD_BOT_TOKEN, TELEGRAM_BOT_TOKEN, DEEPL_API_KEY"
    exit 1
else
    echo "✅ .env file exists"
fi

# Load environment
export $(cat .env | grep -v '#' | xargs)

# Start PM2 with ecosystem config
echo ""
echo "🚀 Starting processes with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
echo "💾 Saving PM2 process list..."
pm2 save

# Set up PM2 to start on system reboot
echo "🔄 Setting up auto-start on system reboot..."
pm2 startup

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                         ✅ Setup Complete!                                 ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

echo ""
echo "📊 Process Status:"
pm2 list

echo ""
echo "📝 Useful Commands:"
echo "  pm2 monit              - Real-time monitoring"
echo "  pm2 logs               - View all logs"
echo "  pm2 logs discord-bot   - View Discord bot logs"
echo "  pm2 logs telegram-bot  - View Telegram bot logs"
echo "  pm2 logs api-server    - View API server logs"
echo "  pm2 restart all        - Restart all processes"
echo "  pm2 stop all           - Stop all processes"
echo "  pm2 delete all         - Delete all processes"

echo ""
echo "🔗 Sentry Setup (Optional but Recommended):"
echo "  1. Go to https://sentry.io and create a free account"
echo "  2. Create projects for Discord, Telegram, and API"
echo "  3. Get DSNs from project settings"
echo "  4. Add to .env:"
echo "     SENTRY_DISCORD_DSN=https://xxx@xxx.ingest.sentry.io/xxx"
echo "     SENTRY_TELEGRAM_DSN=https://xxx@xxx.ingest.sentry.io/xxx"
echo "     SENTRY_API_DSN=https://xxx@xxx.ingest.sentry.io/xxx"
echo "  5. Restart PM2: pm2 restart all"

echo ""
echo "🎉 Ready for 24/7 operation!"
echo "   Bots will auto-restart on crash with logging and error tracking."
