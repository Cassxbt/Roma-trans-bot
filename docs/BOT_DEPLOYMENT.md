# 🤖 Bot Deployment Guide

Complete guide for deploying ROMA Translation Bot to Discord and Telegram.

---

## 📋 Table of Contents

- [Discord Bot Setup](#-discord-bot-setup)
- [Telegram Bot Setup](#-telegram-bot-setup)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 🎮 Discord Bot Setup

### Step 1: Create Discord Application

1. **Visit Discord Developer Portal**
   - Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
   - Click "New Application"
   - Enter name: "ROMA Translation Bot"
   - Click "Create"

2. **Configure Bot**
   - Navigate to "Bot" section in left sidebar
   - Click "Add Bot" → "Yes, do it!"
   - **Important**: Enable these Privileged Gateway Intents:
     - ✅ Message Content Intent
     - ✅ Server Members Intent (optional)
     - ✅ Presence Intent (optional)

3. **Get Bot Token**
   - Click "Reset Token" (or "Copy" if first time)
   - **⚠️ Save this token securely - you won't see it again!**
   - Add to `.env` file:
     ```bash
     DISCORD_BOT_TOKEN=your_bot_token_here
     ```

### Step 2: Set Bot Permissions

1. **Navigate to OAuth2 → URL Generator**
2. **Select Scopes**:
   - ✅ `bot`
   - ✅ `applications.commands`

3. **Select Bot Permissions**:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Send Messages in Threads
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Add Reactions
   - ✅ Use Slash Commands

4. **Copy Generated URL**
   - Use this URL to invite bot to your server

### Step 3: Invite Bot to Server

1. **Open the generated URL** from Step 2
2. **Select your server** from dropdown
3. **Authorize** the bot
4. **Complete CAPTCHA** if prompted

### Step 4: Configure Bot Settings

Edit `config/bot_config.yaml`:

```yaml
discord:
  enabled: true
  prefix: "!"
  commands:
    - translate
    - detect
    - languages
    - help
  features:
    auto_detect: true
    translation_memory: true
    quality_check: true
  rate_limiting:
    enabled: true
    max_requests_per_minute: 10
  permissions:
    admin_roles: []  # Add role IDs for admin commands
    user_roles: []   # Add role IDs for user commands (empty = all users)
```

### Step 5: Run Discord Bot

```bash
# Activate virtual environment
source venv312/bin/activate

# Run bot
python run_discord_bot.py
```

**Expected Output:**
```
✅ Discord bot logged in as: ROMA Translation Bot#1234
✅ Connected to 1 server(s)
✅ Ready to translate!
```

### Discord Bot Commands

```
!translate <text> -t <lang>     # Translate text to target language
!translate <text> -t es fr de   # Translate to multiple languages
!detect <text>                  # Detect language of text
!languages                      # List all supported languages
!help                           # Show help message
!stats                          # Show bot statistics (admin only)
```

### Usage Examples

```
# Single language translation
!translate Hello world -t es
→ Hola mundo

# Multiple languages (ROMA parallel)
!translate Good morning -t es fr de
→ ES: Buenos días
→ FR: Bonjour
→ DE: Guten Morgen

# Auto-detect source language
!translate Bonjour -t en
→ Hello

# Language detection
!detect Hola mundo
→ Detected: Spanish (es) - Confidence: 99%
```

---

## 📱 Telegram Bot Setup

### Step 1: Create Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start conversation** with `/start`
3. **Create new bot**:
   ```
   /newbot
   ```
4. **Enter bot name**: `ROMA Translation Bot`
5. **Enter bot username**: `roma_translation_bot` (must end with 'bot')
6. **Copy the token** provided by BotFather
7. **Add to `.env` file**:
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

### Step 2: Configure Bot Settings

**Set bot description** (optional):
```
/setdescription
Select your bot
Enter: "Intelligent multi-language translation powered by ROMA framework"
```

**Set bot commands** (for command menu):
```
/setcommands
Select your bot
Enter:
translate - Translate text to target language
detect - Detect language of text
languages - List supported languages
help - Show help message
stats - Show translation statistics
```

**Set bot profile picture** (optional):
```
/setuserpic
Select your bot
Upload image
```

### Step 3: Configure Bot Settings

Edit `config/bot_config.yaml`:

```yaml
telegram:
  enabled: true
  commands:
    - translate
    - detect
    - languages
    - help
    - stats
  features:
    inline_mode: true
    auto_detect: true
    translation_memory: true
    quality_check: true
  rate_limiting:
    enabled: true
    max_requests_per_minute: 10
  permissions:
    admin_users: []  # Add user IDs for admin commands
    allowed_users: []  # Add user IDs (empty = all users)
```

### Step 4: Run Telegram Bot

```bash
# Activate virtual environment
source venv312/bin/activate

# Run bot
python run_telegram_bot.py
```

**Expected Output:**
```
✅ Telegram bot started: @roma_translation_bot
✅ Listening for messages...
✅ Ready to translate!
```

### Telegram Bot Commands

```
/translate <text> <lang>        # Translate text to target language
/translate <text> es fr de      # Translate to multiple languages
/detect <text>                  # Detect language of text
/languages                      # List all supported languages
/help                           # Show help message
/stats                          # Show bot statistics
```

### Usage Examples

```
# Single language translation
/translate Hello world es
→ Hola mundo

# Multiple languages (ROMA parallel)
/translate Good morning es fr de
→ 🇪🇸 Spanish: Buenos días
→ 🇫🇷 French: Bonjour
→ 🇩🇪 German: Guten Morgen

# Auto-detect source language
/translate Bonjour en
→ Hello

# Language detection
/detect Hola mundo
→ 🌍 Detected: Spanish (es)
→ 📊 Confidence: 99%

# Inline mode (in any chat)
@roma_translation_bot Hello world es
→ Hola mundo
```

### Inline Mode

Enable inline mode in BotFather:
```
/setinline
Select your bot
Enter: "Translate text..."
```

**Usage in any chat:**
```
@roma_translation_bot <text> <target_lang>
```

---

## 🧪 Testing

### Test Discord Bot

```bash
# In Discord server where bot is invited
!translate Hello world -t es
!detect Bonjour le monde
!languages
!help
```

### Test Telegram Bot

```bash
# In Telegram chat with bot
/translate Hello world es
/detect Bonjour le monde
/languages
/help
```

### Automated Tests

```bash
# Run bot integration tests
pytest tests/test_discord_bot.py
pytest tests/test_telegram_bot.py
```

---

## 🔧 Troubleshooting

### Discord Bot Issues

**Bot not responding:**
- ✅ Check bot token in `.env`
- ✅ Verify Message Content Intent is enabled
- ✅ Ensure bot has proper permissions in server
- ✅ Check bot is online (green status)

**Permission errors:**
- ✅ Re-invite bot with correct permissions
- ✅ Check channel-specific permissions
- ✅ Verify bot role is above restricted roles

**Rate limiting:**
- ✅ Reduce `max_requests_per_minute` in config
- ✅ Implement user-specific cooldowns
- ✅ Use translation memory to reduce API calls

### Telegram Bot Issues

**Bot not responding:**
- ✅ Check bot token in `.env`
- ✅ Verify bot is not blocked
- ✅ Restart bot process
- ✅ Check BotFather for bot status

**Commands not working:**
- ✅ Ensure commands start with `/`
- ✅ Check command format in help message
- ✅ Verify bot has necessary permissions

**Inline mode not working:**
- ✅ Enable inline mode in BotFather
- ✅ Check inline query format
- ✅ Verify bot username is correct

### General Issues

**Translation errors:**
- ✅ Check API keys in `.env`
- ✅ Verify provider status (DeepL/Azure/LibreTranslate)
- ✅ Check API rate limits
- ✅ Review logs for error messages

**Performance issues:**
- ✅ Enable translation memory
- ✅ Increase cache TTL
- ✅ Use ROMA parallel execution
- ✅ Monitor API usage

**Database errors:**
- ✅ Run `python scripts/setup_db.py`
- ✅ Check database file permissions
- ✅ Verify SQLite is installed

---

## 📊 Monitoring

### Bot Statistics

**Discord:**
```
!stats
```

**Telegram:**
```
/stats
```

**Output:**
```
📊 ROMA Translation Bot Statistics

🌍 Translations: 1,234
🔄 Cache Hits: 567 (46%)
⚡ Avg Response Time: 234ms
🎯 Success Rate: 99.2%

Providers:
  • DeepL: 890 (72%)
  • Azure: 234 (19%)
  • LibreTranslate: 110 (9%)

Top Languages:
  1. Spanish (es): 345
  2. French (fr): 234
  3. German (de): 189
```

### Logs

```bash
# View real-time logs
tail -f logs/bot.log

# View error logs
tail -f logs/error.log

# View API usage
tail -f logs/api_usage.log
```

---

## 🚀 Production Deployment

### Using Docker

```bash
# Build image
docker build -t roma-bot .

# Run Discord bot
docker run -d \
  --name roma-discord \
  --env-file .env \
  -e BOT_TYPE=discord \
  roma-bot

# Run Telegram bot
docker run -d \
  --name roma-telegram \
  --env-file .env \
  -e BOT_TYPE=telegram \
  roma-bot
```

### Using systemd (Linux)

Create `/etc/systemd/system/roma-discord.service`:

```ini
[Unit]
Description=ROMA Discord Translation Bot
After=network.target

[Service]
Type=simple
User=roma
WorkingDirectory=/opt/roma-translation-bot
Environment="PATH=/opt/roma-translation-bot/venv312/bin"
ExecStart=/opt/roma-translation-bot/venv312/bin/python run_discord_bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

**Start service:**
```bash
sudo systemctl enable roma-discord
sudo systemctl start roma-discord
sudo systemctl status roma-discord
```

### Cloud Deployment

**Render.com:**
- Add bot as background worker
- Set environment variables
- Deploy from GitHub

**Railway.app:**
- Connect GitHub repository
- Add environment variables
- Deploy automatically

**Fly.io:**
- Use `fly.toml` configuration
- Deploy with `fly deploy`

---

## 📝 Best Practices

### Security
- ✅ Never commit bot tokens to git
- ✅ Use environment variables for secrets
- ✅ Implement rate limiting
- ✅ Validate user input
- ✅ Log security events

### Performance
- ✅ Enable translation memory
- ✅ Use ROMA parallel execution
- ✅ Implement caching
- ✅ Monitor API usage
- ✅ Optimize database queries

### User Experience
- ✅ Provide clear error messages
- ✅ Show translation progress
- ✅ Support multiple languages
- ✅ Implement help commands
- ✅ Add usage examples

---

## 🆘 Support

**Issues?** Open a ticket on [GitHub Issues](https://github.com/yourusername/roma-translation-bot/issues)

**Questions?** Join our [Discord Server](https://discord.gg/your-invite)

**Email:** support@yourdomain.com

---

<div align="center">

**Ready to deploy your translation bot!** 🚀

[← Back to README](../README.md)

</div>
