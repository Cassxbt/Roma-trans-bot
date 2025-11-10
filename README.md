# 🌐 ROMA Translation Bot

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ROMA Framework](https://img.shields.io/badge/ROMA-Framework-green.svg)](https://github.com/sentient-agi/ROMA)

> **Enterprise-grade translation system powered by ROMA framework with intelligent multi-provider fallback**

An intelligent, production-ready translation system featuring ROMA (Recursive-Open-Meta-Agent) framework integration, multi-provider API support with automatic fallback, and parallel execution for optimal performance.

---

## ✨ Features

### 🎯 Core Capabilities
- **🌍 Multi-Language Support** - Translate across 100+ languages with high accuracy
- **🤖 ROMA Framework** - Intelligent task decomposition and parallel execution
- **🔄 Multi-Provider Fallback** - DeepL → Azure → LibreTranslate automatic failover
- **⚡ Parallel Processing** - Simultaneous translation to multiple target languages
- **💾 Translation Memory** - SQLite-based caching for instant repeated translations
- **📊 Quality Scoring** - Automated quality assessment for all translations
- **🎨 Format Preservation** - Maintains text formatting across translations

### 🚀 Interfaces
- ✅ **CLI** - Command-line interface for quick translations
- ✅ **REST API** - FastAPI-powered HTTP endpoints
- 🔜 **Discord Bot** - Real-time translation in Discord servers
- 🔜 **Telegram Bot** - Inline translation for Telegram chats

### 🔒 Enterprise Features
- **API Key Management** - Secure credential handling
- **Rate Limiting** - Built-in protection against API abuse
- **Error Handling** - Graceful degradation with fallback providers
- **Monitoring** - Comprehensive logging and statistics
- **Caching** - In-memory and persistent cache layers

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
  - [CLI](#cli-interface)
  - [REST API](#rest-api)
  - [Discord Bot](#discord-bot-coming-soon)
  - [Telegram Bot](#telegram-bot-coming-soon)
- [Translation Providers](#-translation-providers)
- [Architecture](#-architecture)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+** - [Download](https://www.python.org/downloads/)
- **API Keys** (at least one):
  - [DeepL API](https://www.deepl.com/pro-api) - 500k chars/month free
  - [Azure Translator](https://azure.microsoft.com/en-us/services/cognitive-services/translator/) - 2M chars/month free
  - [LibreTranslate](https://libretranslate.com/) - Free public instance

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/roma-translation-bot.git
cd roma-translation-bot

# 2. Create virtual environment with Python 3.12
python3.12 -m venv venv312
source venv312/bin/activate  # On Windows: venv312\Scripts\activate

# 3. Install dependencies
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# 5. Initialize database
python scripts/setup_db.py

# 6. Test installation
python3 -m src.cli translate "Hello world" -t es
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# ============================================
# Translation Providers (Multi-provider with fallback)
# ============================================

# DeepL API (Primary - Best quality)
DEEPL_API_KEY=your_deepl_api_key_here

# Azure Translator (Fallback)
AZURE_TRANSLATOR_KEY=your_azure_key_here
AZURE_TRANSLATOR_REGION=your_region
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com

# LibreTranslate (Emergency fallback)
LIBRETRANSLATE_ENDPOINT=https://libretranslate.com

# ============================================
# Database & Cache
# ============================================
DATABASE_URL=sqlite:///data/translations.db
CACHE_ENABLED=true
CACHE_TYPE=memory
CACHE_TTL=86400

# ============================================
# Application Settings
# ============================================
LOG_LEVEL=INFO
MAX_TEXT_LENGTH=10000
MAX_TARGET_LANGUAGES=5
MAX_CONCURRENT_TRANSLATIONS=5
```

### Getting API Keys

#### 🔷 DeepL (Recommended)
1. Visit [DeepL API](https://www.deepl.com/pro-api)
2. Sign up for free tier (500k chars/month)
3. Copy your API key to `.env`

#### 🔷 Azure Translator
1. Create [Azure account](https://azure.microsoft.com/free/)
2. Create Translator resource
3. Copy key, region, and endpoint to `.env`

#### 🔷 LibreTranslate
- Use public instance: `https://libretranslate.com`
- Or [self-host](https://github.com/LibreTranslate/LibreTranslate) for unlimited usage

---

## 💻 Usage

### CLI Interface

The command-line interface provides quick access to translation features.

#### Basic Translation

```bash
# Translate to single language
python3 -m src.cli translate "Hello world" -t es

# Translate to multiple languages (ROMA parallel execution)
python3 -m src.cli translate "Good morning" -t es -t fr -t de -t it

# Specify source language
python3 -m src.cli translate "Bonjour" --from fr -t en
```

#### Language Detection

```bash
# Detect language of text
python3 -m src.cli detect "Hola mundo"
```

#### System Information

```bash
# View system status and statistics
python3 -m src.cli info

# List all supported languages
python3 -m src.cli languages
```

#### File Translation

```bash
# Translate file contents
python3 -m src.cli translate-file input.txt -t es -o output.txt
```

---

### REST API

Start the FastAPI server:

```bash
# Development mode
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 5000

# Production mode
uvicorn src.api.main:app --host 0.0.0.0 --port 5000 --workers 4
```

#### API Endpoints

**📍 Translate Text**
```bash
curl -X POST http://localhost:5000/api/v1/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "target_languages": ["es", "fr", "de"],
    "source_language": "en"
  }'
```

**📍 Detect Language**
```bash
curl -X POST http://localhost:5000/api/v1/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour le monde"}'
```

**📍 List Supported Languages**
```bash
curl http://localhost:5000/api/v1/languages
```

**📍 Health Check**
```bash
curl http://localhost:5000/api/v1/health
```

**📍 Translation Statistics**
```bash
curl http://localhost:5000/api/v1/stats
```

#### Interactive API Documentation

- **Swagger UI**: [http://localhost:5000/docs](http://localhost:5000/docs)
- **ReDoc**: [http://localhost:5000/redoc](http://localhost:5000/redoc)

---

### Discord Bot (Coming Soon)

> 🔜 **Status**: Ready for deployment

#### Features
- Real-time message translation
- Language detection
- Multi-language support
- Server-specific settings
- Role-based permissions

#### Setup Instructions

```bash
# 1. Create Discord Bot
# Visit: https://discord.com/developers/applications
# Create new application → Bot → Copy token

# 2. Add bot token to .env
echo "DISCORD_BOT_TOKEN=your_bot_token_here" >> .env

# 3. Run the bot
python run_discord_bot.py
```

#### Bot Commands
```
!translate <text> -t <lang>     # Translate text
!detect <text>                  # Detect language
!languages                      # List supported languages
!help                           # Show help message
```

---

### Telegram Bot (Coming Soon)

> 🔜 **Status**: Ready for deployment

#### Features
- Inline translation
- Group chat support
- Private message translation
- Language auto-detection
- Translation history

#### Setup Instructions

```bash
# 1. Create Telegram Bot
# Message @BotFather on Telegram
# Use /newbot command → Copy token

# 2. Add bot token to .env
echo "TELEGRAM_BOT_TOKEN=your_bot_token_here" >> .env

# 3. Run the bot
python run_telegram_bot.py
```

#### Bot Commands
```
/translate <text> <lang>        # Translate text
/detect <text>                  # Detect language
/languages                      # List supported languages
/help                           # Show help message
```

---

## 🔄 Translation Providers

### Provider Hierarchy

The system uses intelligent fallback across three providers:

```
1. DeepL (Primary)
   ├─ Best quality translations
   ├─ 500k chars/month free
   └─ Supports 30+ languages

2. Azure Translator (Fallback)
   ├─ Enterprise-grade reliability
   ├─ 2M chars/month free
   └─ Supports 100+ languages

3. LibreTranslate (Emergency)
   ├─ Open-source solution
   ├─ Unlimited free usage
   └─ Self-hostable
```

### Provider Selection Logic

```python
# Automatic provider selection:
1. Try DeepL (best quality)
2. If DeepL fails → Try Azure
3. If Azure fails → Try LibreTranslate
4. If all fail → Return error with details
```

### Supported Languages

**DeepL**: EN, DE, FR, ES, IT, PT, NL, PL, RU, JA, ZH, and more  
**Azure**: 100+ languages including regional variants  
**LibreTranslate**: 30+ languages with community support

[View full language list →](docs/LANGUAGES.md)

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                  INTERFACE LAYER                         │
│  CLI | REST API | Discord Bot | Telegram Bot            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              ROMA ORCHESTRATION                          │
│  • Task Decomposition                                    │
│  • Parallel Execution (5 concurrent max)                 │
│  • Intelligent Routing                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         MULTI-PROVIDER TRANSLATION                       │
│  1. DeepL Provider (Primary)                             │
│  2. Azure Translator (Fallback)                          │
│  3. LibreTranslate (Emergency)                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         STORAGE & SERVICES                               │
│  • SQLite (Translation Memory)                           │
│  • In-Memory Cache                                       │
│  • Quality Scoring Engine                                │
│  • Format Preservation                                   │
└─────────────────────────────────────────────────────────┘
```

### Key Components

- **`src/core/translation_agent.py`** - Main translation orchestrator
- **`src/core/roma_integration.py`** - ROMA framework integration
- **`src/services/translation_providers.py`** - Multi-provider system
- **`src/executors/`** - Task executors (translation, quality check, etc.)
- **`src/api/`** - FastAPI REST endpoints
- **`src/cli/`** - Command-line interface
- **`src/bots/`** - Discord and Telegram bot implementations

---

## 🛠️ Development

### Project Structure

```
roma-translation-bot/
├── src/
│   ├── core/              # Core translation logic
│   ├── services/          # External service integrations
│   ├── executors/         # Task executors
│   ├── api/               # REST API
│   ├── cli/               # CLI interface
│   ├── bots/              # Bot implementations
│   └── utils/             # Utility functions
├── config/                # Configuration files
├── data/                  # Database and cache
├── scripts/               # Setup and utility scripts
├── tests/                 # Test suite
└── docs/                  # Documentation
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src tests/

# Run specific test file
pytest tests/test_translation.py
```

### Code Quality

```bash
# Format code
black src/

# Lint code
flake8 src/

# Type checking
mypy src/
```

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t roma-translation-bot .

# Run container
docker run -d \
  --name translation-bot \
  -p 5000:5000 \
  --env-file .env \
  roma-translation-bot
```

### Cloud Platforms

#### Render.com
```bash
# Deploy using render.yaml
render deploy
```

#### Railway.app
```bash
# Deploy using railway.toml
railway up
```

#### Fly.io
```bash
# Deploy using fly.toml
fly deploy
```

[View detailed deployment guide →](docs/DEPLOYMENT.md)

---

## 📊 Performance

### Benchmarks

- **Single Translation**: ~200-500ms (DeepL)
- **Parallel (3 languages)**: ~300-600ms (ROMA)
- **Cache Hit**: <10ms (instant)
- **Translation Memory**: <50ms (SQLite)

### Capacity

- **DeepL Free**: 500,000 chars/month
- **Azure Free**: 2,000,000 chars/month
- **LibreTranslate**: Unlimited (public instance)
- **Total Free Tier**: ~2.5M chars/month

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/roma-translation-bot.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create pull request
git push origin feature/amazing-feature
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[ROMA Framework](https://github.com/sentient-agi/ROMA)** - Recursive-Open-Meta-Agent framework
- **[DeepL](https://www.deepl.com/)** - High-quality translation API
- **[Azure Translator](https://azure.microsoft.com/en-us/services/cognitive-services/translator/)** - Enterprise translation service
- **[LibreTranslate](https://libretranslate.com/)** - Open-source translation platform

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/roma-translation-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/roma-translation-bot/discussions)
- **Email**: support@yourdomain.com

---

## 🗺️ Roadmap

- [x] Multi-provider translation system
- [x] ROMA framework integration
- [x] CLI interface
- [x] REST API
- [x] Translation memory
- [x] Quality scoring
- [ ] Discord bot deployment
- [ ] Telegram bot deployment
- [ ] Web interface
- [ ] Batch translation
- [ ] Custom model fine-tuning
- [ ] Real-time streaming translation

---

<div align="center">

**Made with ❤️ using ROMA Framework**

[⭐ Star this repo](https://github.com/yourusername/roma-translation-bot) | [🐛 Report Bug](https://github.com/yourusername/roma-translation-bot/issues) | [✨ Request Feature](https://github.com/yourusername/roma-translation-bot/issues)

</div>
