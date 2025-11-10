# ⚡ Quick Start Guide

Get ROMA Translation Bot running in 5 minutes!

---

## 🎯 Prerequisites

- ✅ Python 3.12+ installed
- ✅ At least one API key (DeepL, Azure, or LibreTranslate)
- ✅ Terminal/Command Prompt access

---

## 🚀 Installation (5 Steps)

### 1️⃣ Clone & Navigate

```bash
git clone https://github.com/yourusername/roma-translation-bot.git
cd roma-translation-bot
```

### 2️⃣ Create Virtual Environment

```bash
python3.12 -m venv venv312
source venv312/bin/activate  # Windows: venv312\Scripts\activate
```

### 3️⃣ Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4️⃣ Configure Environment

```bash
cp .env.example .env
nano .env  # Or use any text editor
```

**Add at least one API key:**
```bash
DEEPL_API_KEY=your_key_here
# OR
AZURE_TRANSLATOR_KEY=your_key_here
# OR use LibreTranslate (no key needed)
```

### 5️⃣ Initialize Database

```bash
python scripts/setup_db.py
```

---

## ✅ Test Installation

```bash
# Test translation
python3 -m src.cli translate "Hello world" -t es

# Expected output:
# ✅ Translation complete!
# ES: Hola mundo
```

---

## 🎮 Choose Your Interface

### Option A: CLI (Command Line)

```bash
# Single language
python3 -m src.cli translate "Good morning" -t es

# Multiple languages (ROMA parallel)
python3 -m src.cli translate "Good morning" -t es -t fr -t de

# Detect language
python3 -m src.cli detect "Bonjour"

# System info
python3 -m src.cli info
```

### Option B: REST API

```bash
# Start server
uvicorn src.api.main:app --reload --port 5000

# In another terminal, test:
curl -X POST http://localhost:5000/api/v1/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "target_languages": ["es"]}'

# Open browser: http://localhost:5000/docs
```

### Option C: Discord Bot

```bash
# 1. Get bot token from Discord Developer Portal
# 2. Add to .env:
echo "DISCORD_BOT_TOKEN=your_token_here" >> .env

# 3. Run bot
python run_discord_bot.py

# 4. In Discord server:
!translate Hello world -t es
```

### Option D: Telegram Bot

```bash
# 1. Get bot token from @BotFather
# 2. Add to .env:
echo "TELEGRAM_BOT_TOKEN=your_token_here" >> .env

# 3. Run bot
python run_telegram_bot.py

# 4. In Telegram:
/translate Hello world es
```

---

## 📚 Next Steps

- 📖 Read full [README.md](README.md)
- 🤖 Deploy bots: [Bot Deployment Guide](docs/BOT_DEPLOYMENT.md)
- 🚀 Production deployment: [Deployment Guide](docs/DEPLOYMENT.md)
- 🔧 Advanced configuration: [Configuration Guide](docs/CONFIGURATION.md)

---

## 🆘 Troubleshooting

### "Module not found" error
```bash
# Make sure venv is activated
source venv312/bin/activate
pip install -r requirements.txt
```

### "API key not found" error
```bash
# Check .env file exists and has keys
cat .env
# Make sure no spaces around = sign
DEEPL_API_KEY=your_key_here
```

### Translation fails
```bash
# Check provider status
python3 -m src.cli info
# Try different provider in .env
```

### Bot not responding
```bash
# Check bot token
echo $DISCORD_BOT_TOKEN  # or TELEGRAM_BOT_TOKEN
# Verify token in .env file
# Restart bot
```

---

## 💡 Pro Tips

✨ **Use ROMA parallel execution** for multiple languages - it's 3-5x faster!

✨ **Enable translation memory** - repeated translations are instant

✨ **Monitor API usage** with `python3 -m src.cli info`

✨ **Use LibreTranslate** as free fallback - no API key needed

---

## 🎉 You're Ready!

Your ROMA Translation Bot is now running. Start translating! 🌍

**Need help?** Open an issue on [GitHub](https://github.com/yourusername/roma-translation-bot/issues)

---

<div align="center">

**Happy Translating! 🚀**

[← Back to README](README.md) | [Bot Deployment →](docs/BOT_DEPLOYMENT.md)

</div>
