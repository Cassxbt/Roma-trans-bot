# 🧪 Discord Bot Stress Test Guide

## Test Scenarios

### 1. Natural Language Parsing Tests

```
!translate hello to French
Expected: 🇫🇷 Bonjour

!translate good morning to Spanish
Expected: 🇪🇸 Buenos días

!translate "how are you" to German
Expected: 🇩🇪 Wie geht es dir

!translate bonjour in English
Expected: 🌍 Hello

!translate hello to French and Spanish
Expected:
🇫🇷 **FR**: Bonjour
🇪🇸 **ES**: Hola

!translate "good morning mom" to French
Expected: 🇫🇷 Bonjour maman

!translate hello to Spanish, French, and German
Expected:
🇪🇸 **ES**: Hola
🇫🇷 **FR**: Bonjour
🇩🇪 **DE**: Hallo
```

### 2. Classic Format Tests

```
!translate hello --to es
Expected: 🇪🇸 Hola

!translate hello --to es fr de
Expected:
🇪🇸 **ES**: Hola
🇫🇷 **FR**: Bonjour
🇩🇪 **DE**: Hallo

!translate "good morning" --to es fr de it
Expected: All 4 translations with flags
```

### 3. ROMA Parallel Execution Tests

```
!translate hello --to es fr de it pt
Expected: 5 translations in parallel (ROMA kicks in)
Time: Should be <500ms

!translate "The quick brown fox jumps over the lazy dog" --to es fr de it pt ru ja zh ko
Expected: 9 translations in parallel
Time: Should be <800ms
```

### 4. Edge Cases

```
!translate
Expected: ❌ Please provide text to translate.

!translate hello
Expected: ❌ Could not understand request.

!translate hello to
Expected: ❌ Could not understand request.

!translate hello to InvalidLanguage
Expected: ❌ Could not understand request.

!translate "" to French
Expected: Error handling

!translate hello to French Spanish German Italian Portuguese Russian Japanese Chinese Korean
Expected: All 9 translations (max concurrent test)
```

### 5. Long Text Tests

```
!translate "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." to Spanish
Expected: Full translation

!translate "Very long text with multiple sentences. This should test the translation quality and handling of longer content. The bot should handle this gracefully." --to es fr de
Expected: All 3 translations of full text
```

### 6. Special Characters

```
!translate "Hello! How are you?" to French
Expected: 🇫🇷 Bonjour ! Comment allez-vous ?

!translate "I'm fine, thank you!" to Spanish
Expected: 🇪🇸 ¡Estoy bien, gracias!

!translate "¿Cómo estás?" in English
Expected: 🌍 How are you?

!translate "こんにちは" to English
Expected: 🌍 Hello
```

### 7. Mixed Language Input

```
!translate "Hello, bonjour, hola" to German
Expected: 🇩🇪 Hallo, guten Tag, hallo

!translate "I love café" to French
Expected: 🇫🇷 J'aime le café
```

### 8. Command Aliases

```
!t hello to French
Expected: Same as !translate

!tr hello to Spanish
Expected: Same as !translate
```

### 9. Other Commands

```
!detect Hello world
Expected: Detected language: **en**

!detect Bonjour le monde
Expected: Detected language: **fr**

!detect Hola mundo
Expected: Detected language: **es**

!languages
Expected: List of supported languages

!help-translate
Expected: Help message with examples

!h
Expected: Same as !help-translate
```

### 10. Concurrent Request Tests

**Send multiple requests simultaneously:**

```
User 1: !translate hello to French
User 2: !translate hello to Spanish
User 3: !translate hello to German
User 4: !translate hello to Italian
User 5: !translate hello to Portuguese

Expected: All should complete successfully within 1-2 seconds
```

### 11. Rate Limiting Tests

**Send 10+ requests rapidly:**

```
!translate hello to French
!translate hello to Spanish
!translate hello to German
... (repeat 10 times)

Expected: All should work, or rate limit message after threshold
```

### 12. Error Recovery Tests

**Test provider fallback:**

```
# If DeepL fails, should fallback to Azure
# If Azure fails, should fallback to LibreTranslate
# Monitor console logs for fallback messages
```

---

## Performance Benchmarks

### Target Metrics:

| Scenario | Target Time | Max Time |
|----------|-------------|----------|
| Single translation | <300ms | 500ms |
| 3 languages (ROMA) | <400ms | 600ms |
| 5 languages (ROMA) | <500ms | 800ms |
| 9 languages (ROMA) | <800ms | 1200ms |

### Success Rate Targets:

- **Primary provider (DeepL)**: >95%
- **Overall success rate**: >99%
- **Fallback usage**: <5%

---

## Load Testing

### Sustained Load Test:

```bash
# Send 100 requests over 5 minutes
# Monitor:
- Response times
- Error rates
- Memory usage
- Provider distribution
```

### Burst Test:

```bash
# Send 20 requests in 10 seconds
# Monitor:
- Queue handling
- Concurrent execution
- Rate limiting
- Error handling
```

---

## Monitoring Checklist

During stress testing, monitor:

- [ ] Response times (average, p95, p99)
- [ ] Error rates per provider
- [ ] Fallback frequency
- [ ] Memory usage
- [ ] CPU usage
- [ ] Network latency
- [ ] Database performance
- [ ] Cache hit rate
- [ ] ROMA parallel execution efficiency

---

## Expected Console Output

### Successful Translation:
```
🔄 Translating...
✅ Using DeepL provider
⚡ ROMA parallel execution: 3 translations
✅ Translation complete (234ms)
```

### Provider Fallback:
```
⚠️ DeepL failed: Rate limit exceeded
⚠️ Trying Azure Translator...
✅ Azure Translator success
✅ Translation complete (345ms)
```

### ROMA Parallel:
```
⚡ ROMA parallel execution: 5 translations
✅ Completed 5/5 translations
✅ Average time: 287ms per translation
```

---

## Failure Scenarios to Test

1. **Invalid API Key**
   - Temporarily use wrong key
   - Expected: Fallback to next provider

2. **Network Timeout**
   - Simulate slow network
   - Expected: Timeout and fallback

3. **Malformed Input**
   - Send empty strings, special chars
   - Expected: Graceful error messages

4. **Unsupported Language**
   - Request translation to invalid language
   - Expected: Clear error message

5. **Rate Limit Exceeded**
   - Exceed provider limits
   - Expected: Automatic fallback

---

## Success Criteria

✅ **Pass if:**
- All natural language formats work
- Response times meet targets
- Error messages are clear
- Fallback system works
- ROMA parallel execution functions
- No crashes or hangs
- Memory usage stable
- Clean output (no metadata shown)

❌ **Fail if:**
- Any command crashes bot
- Response times exceed max
- Error messages unclear
- Fallback doesn't work
- Memory leaks detected
- Inconsistent behavior

---

## Post-Test Analysis

After stress testing, review:

1. **Performance Metrics**
   - Average response time
   - P95/P99 response times
   - Success rate per provider
   - Cache hit rate

2. **Error Analysis**
   - Most common errors
   - Provider failure patterns
   - Edge cases discovered

3. **User Experience**
   - Command clarity
   - Output readability
   - Error message helpfulness

4. **Optimization Opportunities**
   - Slow queries
   - Inefficient code paths
   - Cache improvements

---

## Test Execution

```bash
# 1. Start bot
cd /Users/apple/roma-translation-bot
source venv312/bin/activate
python3 run_discord_bot.py

# 2. Run tests in Discord server
# Follow test scenarios above

# 3. Monitor logs
tail -f logs/bot.log

# 4. Check statistics
!stats (if admin)
```

---

## Automated Test Script (Optional)

```python
# tests/automated_discord_stress_test.py
import asyncio
import discord

async def run_stress_test():
    # Send test commands programmatically
    test_commands = [
        "!translate hello to French",
        "!translate hello to Spanish and German",
        "!translate hello --to es fr de it pt",
        # ... more tests
    ]
    
    for cmd in test_commands:
        await channel.send(cmd)
        await asyncio.sleep(1)
```

---

<div align="center">

**Ready to stress test! 🚀**

Run through all scenarios and document results.

</div>
