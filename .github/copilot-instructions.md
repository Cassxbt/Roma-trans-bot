# ROMA Translation Bot - AI Agent Instructions

## Project Mission
Enterprise-grade multi-language translation system using the ROMA (Recursive-Open-Meta-Agent) framework. Provides Discord/Telegram bots, REST API, and CLI for translating text to 100+ languages with intelligent parallel execution and multi-provider fallback.

---

## Architecture Overview

### Core Components

**ROMA Translation Agent** (`src/core/translation_agent.py`)
- Main orchestrator using ROMA's atomizer/planner/executor/aggregator pattern
- Handles input validation, language detection, and result aggregation
- Entry point: `TranslationBot.translate(text, target_languages, source_language)`
- Key responsibility: Delegates to specialized executors and services

**ROMA Integration** (`src/core/roma_integration.py`)
- Implements ROMA workflow for intelligent parallel execution
- `TranslationROMA.translate()` - orchestrates multi-language translations
- Decides whether parallel execution is beneficial (len > 1 and <= 10 languages)
- Creates execution plans as SubTasks, executes in parallel, aggregates results

**Multi-Provider Translation Service** (`src/services/translation_providers.py`)
- Implements cascading fallback strategy: DeepL → Azure Translator → LibreTranslate
- Each provider is a class inheriting from `TranslationProvider` (abstract base)
- Tracks usage_count and error_count for monitoring
- Key method: `MultiProviderTranslationService.translate(text, source_lang, target_lang)`

### Data Flow
```
User Input (Bot/API/CLI)
  ↓
TranslationBot.translate()
  ├─ Language Detection (LanguageDetectionExecutor)
  ├─ ROMA parallel orchestration (TranslationROMA)
  │   └─ Cache check → Translation service → Format preservation
  ├─ Quality check (QualityCheckExecutor)
  └─ Response formatting
  ↓
Cache (SimpleCacheService) + Memory (DatabaseService)
```

### Service Boundaries

| Service | Responsibility | Key Files |
|---------|---|---|
| **Translation Providers** | API integration with DeepL/Azure/LibreTranslate | `translation_providers.py` |
| **Cache Service** | In-memory translation cache with TTL | `cache_service.py` |
| **Database Service** | SQLite storage for translation memory and stats | `database_service.py` |
| **Config Loader** | YAML-based configuration with env override | `config_loader.py` |
| **Executors** | Specialized tasks (detection, translation, quality, formatting) | `executors/*.py` |

---

## Critical Developer Workflows

### Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your API keys (DEEPL_API_KEY, DISCORD_BOT_TOKEN, TELEGRAM_BOT_TOKEN)

# Run Discord bot
python run_discord_bot.py

# Run Telegram bot
python run_telegram_bot.py

# Run API server
python run_api.py  # Starts FastAPI on http://localhost:8000

# CLI command
python -m src.cli.commands translate "hello" --to es fr de
```

### Running Tests

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/unit/test_cache_service.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run async tests (pytest-asyncio)
pytest tests/unit/ -v --asyncio-mode=auto
```

### Configuration & Hot Reload

- Configuration is **cached on first access** in `ConfigLoader._config_cache`
- Call `config_loader.reload_config()` to clear cache and reload YAML files
- All configuration also checks environment variables for overrides
- Key config file: `config/agent_config.yaml` controls ROMA settings, cache, database paths

---

## Project-Specific Patterns & Conventions

### Async/Await Pattern
- All translation, database, and cache operations are **async**
- Use `await` for all service calls: `await self.translation_service.translate(...)`
- Executors follow `async def execute(*args, **kwargs)` signature
- Tests use `pytest-asyncio` with `asyncio_mode = "auto"` (see `pyproject.toml`)

### Executor Pattern
- Every major feature is an Executor inheriting from `BaseExecutor`
- Must implement `async def execute(*args, **kwargs)`
- Examples: `LanguageDetectionExecutor`, `TranslationExecutor`, `QualityCheckExecutor`
- Executors are **independent**, composed in `TranslationBot.__init__`

### Multi-Provider Fallback
- **Never** assume a single provider works - always have fallback configured
- Order matters: DeepL (best quality) → Azure (reliable) → LibreTranslate (free)
- Providers track `usage_count` and `error_count` for monitoring
- If a provider fails, `MultiProviderTranslationService` automatically tries next

### Natural Language Parsing (Bots)
- Both Discord and Telegram bots use identical parsing logic in `_parse_natural_language()`
- Supports formats: `"hello" to French`, `"hello" to es fr de`, `"hello" --to es fr`
- Last occurrence of " to " or " in " is used to split text from languages
- Language names mapped to codes in dict (e.g., `'spanish': 'es'`)

### Cache & Translation Memory
- **Cache**: Fast, volatile (TTL-based), in-memory in `SimpleCacheService`
- **Translation Memory**: Persistent, in database via `DatabaseService.save_to_memory()`
- Both use same key signature: `text + source_lang + target_lang`
- Always check cache before database, then database before calling provider

### Configuration Defaults (From `config/agent_config.yaml`)
```yaml
max_text_length: 10000
max_target_languages: 10  # Limits parallel execution
max_concurrent: 5  # ROMA executor concurrency
translation_memory: true
quality_check: true
cache_ttl: 86400 (24 hours)
```

---

## Integration Points & External Dependencies

### API Clients
- **DeepL SDK**: `import deepl; translator = deepl.Translator(api_key)`
- **Discord.py**: `from discord.ext import commands; Bot(command_prefix='!', intents=...)`
- **Telegram Bot API**: `from telegram.ext import Application, CommandHandler`
- **HTTPX**: Used for async HTTP requests in fallback providers

### Bot Token Management
- Tokens stored in `.env` file (never commit!)
- Loaded via `os.getenv()` in bot constructors
- Validation happens in `__init__`: raises `ValueError` if token missing
- Both bots use same token format but different platforms

### Database Schema (SQLite)
- Auto-initialized in `DatabaseService.initialize()`
- Stores translation memory (text_hash, source, target, translation, timestamp)
- Also stores usage statistics per provider
- See `database_service.py` for actual schema initialization

### Rate Limiting
- API implements simple rate limiting: **20 requests per minute per IP** (free tier)
- Client IP tracked in `request_counts` dict in middleware
- Returns 429 status with `retry_after` header on limit exceeded
- Cleanup old entries periodically (every 5 minutes)

---

## When Modifying Code - Key Considerations

### Adding a New Translation Provider
1. Create class inheriting from `TranslationProvider` abstract base
2. Implement `translate()`, `has_quota()`, `get_supported_languages()`
3. Add to fallback chain in `MultiProviderTranslationService.translate()`
4. Register provider initialization in `__init__`
5. Add error handling to gracefully skip if API key missing

### Adding a New Executor
1. Inherit from `BaseExecutor` (in `src/executors/base.py`)
2. Implement `async def execute(*args, **kwargs) -> Any`
3. Instantiate in `TranslationBot.__init__`
4. Call from `translate()` or other executors as needed
5. Write unit tests in `tests/unit/` following cache service pattern

### Adding Bot Commands
- Reuse `BotTranslationHandler` - already implements core logic
- Implement `_parse_natural_language()` to extract text and languages
- Call `handler.handle_translate_command()` and `format_translation_response()`
- Both Discord and Telegram use nearly identical patterns - keep synchronized

### Modifying Configuration
- Change values in `config/agent_config.yaml` (persisted across runs)
- For testing, use environment variables to override temporarily
- Don't hardcode values - always use `ConfigLoader.get_config()`
- Remember to call `reload_config()` in tests to avoid cache interference

---

## Common Anti-Patterns to Avoid

❌ **Blocking I/O** - Use `await` and async functions everywhere; never use `time.sleep()` in async code
❌ **Single Provider Assumption** - Always ensure fallback is configured and tested
❌ **Cache Busting** - Don't skip cache checks "just to be safe"; the cache is reliable
❌ **Direct Database Access** - Use `DatabaseService` methods, not raw SQL
❌ **Hardcoded Configuration** - Load from config files or environment variables
❌ **Silent Failures** - Always log errors with context; raise or return error dicts
❌ **Circular Imports** - Services import executors, but executors don't import services

---

## Essential File References

| What | File |
|------|------|
| Main translation logic | `src/core/translation_agent.py` |
| ROMA orchestration | `src/core/roma_integration.py` |
| Service composition | `src/core/translation_agent.py` → `__init__` method |
| Configuration | `config/agent_config.yaml` |
| API endpoints | `src/api/routes/translation.py` |
| Discord bot | `src/bots/discord_bot.py` |
| Telegram bot | `src/bots/telegram_bot.py` |
| Bot shared logic | `src/bots/bot_handlers.py` |
| Test structure | `tests/unit/test_cache_service.py` (example) |

---

## Development Tips

- **Debugging translation issues**: Check cache status first (`cache.get()`), then translation memory, then enable debug logging in provider
- **Testing ROMA parallel execution**: Use `should_use_parallel()` to verify conditions; mock providers with fixed delays to observe parallelism
- **Adding languages**: Update `lang_map` dict in bot parsers and ensure provider supports the code
- **Performance**: Monitor `MultiProviderTranslationService.usage_count` to track provider load; adjust max_concurrent if timeouts occur
