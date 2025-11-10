# Telegram Bot Setup Guide 🤖

**Date:** November 10, 2025
**Status:** READY FOR TESTING
**Bot Name:** ROMA Translation Bot

---

## ✅ Setup Complete

The Telegram bot has been successfully configured and is ready for testing!

### What's Been Done:
1. ✅ Updated Telegram bot with natural language parsing (same as Discord)
2. ✅ Added clean, professional output with flag emojis
3. ✅ Integrated ROMA parallel execution
4. ✅ Added comprehensive help and start commands
5. ✅ Updated runner script with config reload
6. ✅ Bot token configured in `.env`
7. ✅ python-telegram-bot library installed (v22.5)

---

## 🚀 Running the Bot

### Start Telegram Bot
```bash
cd /Users/apple/roma-translation-bot
source venv312/bin/activate
python3 run_telegram_bot.py
```

### Start Discord Bot (in separate terminal)
```bash
cd /Users/apple/roma-translation-bot
source venv312/bin/activate
python3 run_discord_bot.py
```

---

## 📱 Testing the Telegram Bot

### 1. Find Your Bot
Search for your bot on Telegram using the bot username (get from @BotFather)

### 2. Start the Bot
Send: `/start`

**Expected Response:**
```
👋 Welcome to ROMA Translation Bot!

🌍 Translate to multiple languages instantly!

Natural Language:
/translate hello to Spanish French German
/translate I love you to Korean Chinese Japanese

Classic Format:
/translate hello --to es fr de

Other Commands:
/detect <text> - Detect language
/help - Show all commands
```

### 3. Test Natural Language Translation
```
/translate hello to Spanish French German
```

**Expected:** 3 translations with flags:
```
🇪🇸 ES: hola
🇫🇷 FR: Bonjour
🇩🇪 DE: hallo
```

### 4. Test Complex Sentence
```
/translate I just want to say thank you my beautiful baby princess to Korean Chinese French
```

**Expected:** Full sentence translated to 3 languages

### 5. Test Maximum Capacity (10 languages)
```
/translate hello to Spanish French German Italian Portuguese Russian Japanese Chinese Korean Arabic
```

**Expected:** 10 translations with ROMA parallel execution

### 6. Test Classic Format
```
/translate hello --to es fr de
```

**Expected:** 3 translations

### 7. Test Language Detection
```
/detect Bonjour comment allez-vous?
```

**Expected:** Language detection result

### 8. Test Help Command
```
/help
```

**Expected:** Comprehensive help message with examples

---

## 🎯 Features

### Natural Language Parsing
- ✅ Understands: "translate hello to Spanish French"
- ✅ Handles complex sentences with multiple "to" words
- ✅ Supports "and" and commas: "to French and Spanish"
- ✅ Language names: Spanish, French, German, etc.
- ✅ Language codes: es, fr, de, etc.

### Translation Features
- ✅ Up to 10 languages simultaneously
- ✅ ROMA parallel execution for speed
- ✅ Multi-provider fallback (DeepL → Azure → LibreTranslate)
- ✅ Clean output with flag emojis
- ✅ Automatic language detection
- ✅ Translation memory/caching

### User Experience
- ✅ Typing indicator while translating
- ✅ Markdown formatting for better readability
- ✅ Clear error messages
- ✅ Helpful examples in error messages

---

## 📊 Comparison: Telegram vs Discord

| Feature | Telegram | Discord |
|---------|----------|---------|
| Natural Language | ✅ | ✅ |
| Max Languages | 10 | 10 |
| ROMA Parallel | ✅ | ✅ |
| Clean Output | ✅ | ✅ |
| Flag Emojis | ✅ | ✅ |
| Typing Indicator | ✅ | ❌ |
| Command Prefix | / | ! |
| Markdown Support | ✅ | ✅ |

---

## 🔧 Configuration

### Bot Token
Located in `.env`:
```
TELEGRAM_BOT_TOKEN=8511385948:AAEWrkd_00K1-3B_W37l-UGqmdXo-StRyYw
```

### Translation Providers
Same as Discord bot:
- DeepL (primary)
- Azure Translator (fallback)
- LibreTranslate (emergency)

### Limits
- Max target languages: 10
- Max text length: 10,000 characters
- Max concurrent translations: 5

---

## 📝 Command Reference

### Translation Commands
```
/translate <text> to <languages>
/translate <text> --to <lang1> <lang2> ...
```

**Examples:**
```
/translate hello to Spanish
/translate hello to Spanish French German
/translate I love you to Korean Chinese Japanese
/translate "good morning" --to es fr de
```

### Other Commands
```
/start - Welcome message
/help - Show all commands
/detect <text> - Detect language
```

---

## 🧪 Stress Test Checklist

Run these tests to verify the bot:

- [ ] Simple translation (1 language)
- [ ] Multiple languages (3 languages)
- [ ] Maximum capacity (10 languages)
- [ ] Complex sentence with multiple "to" words
- [ ] Long paragraph
- [ ] Text with punctuation
- [ ] Text with emojis
- [ ] Numbers and dates
- [ ] Questions and exclamations
- [ ] Classic format (--to)
- [ ] Language detection
- [ ] Error handling (no text, no languages, invalid language)

---

## 🐛 Troubleshooting

### Bot Not Responding
1. Check if bot is running: `ps aux | grep run_telegram_bot`
2. Check terminal for errors
3. Verify bot token in `.env`
4. Restart bot: `killall -9 Python && python3 run_telegram_bot.py`

### Translation Errors
1. Check provider API keys in `.env`
2. Verify provider quotas (DeepL, Azure)
3. Check terminal logs for provider failures

### Parser Issues
1. Ensure language names are spelled correctly
2. Use language codes if names don't work
3. Try classic format with `--to`

---

## 🚀 Next Steps

1. **Test the bot** - Run all stress tests
2. **Report issues** - Note any errors or unexpected behavior
3. **Compare with Discord** - Ensure feature parity
4. **Production deployment** - Set up process manager (PM2, systemd)
5. **Monitoring** - Set up logging and error tracking

---

## 📞 Bot Information

**Platform:** Telegram
**Library:** python-telegram-bot v22.5
**Python:** 3.12
**Framework:** ROMA Translation Framework
**Providers:** DeepL, Azure Translator, LibreTranslate

---

## ✅ Status

**Telegram Bot:** READY FOR TESTING ✅
**Discord Bot:** PRODUCTION READY ✅
**Both Bots Running:** YES ✅

**Start testing the Telegram bot now!** 🚀
