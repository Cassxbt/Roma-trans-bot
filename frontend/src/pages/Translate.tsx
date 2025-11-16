import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";
import { VoiceRecorder } from "../components/VoiceRecorder";

type Language = {
  code: string;
  name: string;
  flag: string;
};

type TranslationResult = {
  code: string;
  name: string;
  flag: string;
  text: string;
  quality: number;
};

type HistoryItem = {
  id: number;
  sourceText: string;
  targetLanguages: string[];
  timestamp: string;
};

export default function Translate() {
  const [text, setText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLangs, setTargetLangs] = useState<Language[]>([
    { code: "es", name: "Spanish", flag: "🇪🇸" },
  ]);
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isFromVoice, setIsFromVoice] = useState(false);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const maxChars = 5000;
  const charCount = text.length;

  const availableLanguages: Language[] = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
  ];

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('translationHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const removeLanguage = (code: string) => {
    setTargetLangs(targetLangs.filter((l) => l.code !== code));
  };

  const addLanguage = (lang: Language) => {
    if (targetLangs.length >= 10) {
      setError("Maximum 10 languages allowed");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!targetLangs.find((l) => l.code === lang.code)) {
      setTargetLangs([...targetLangs, lang]);
      setShowAddLanguage(false);
    }
  };

  const getLanguageFlag = (code: string) => {
    if (code === "auto") return "🌍";
    const lang = availableLanguages.find(l => l.code === code);
    return lang?.flag || "🏳️";
  };

  const getLanguageName = (code: string) => {
    if (code === "auto") return "Auto-detect";
    const lang = availableLanguages.find(l => l.code === code);
    return lang?.name || code.toUpperCase();
  };

  async function handleTranslate(isRetry = false) {
    if (!text.trim()) {
      setError("Please enter text to translate");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (targetLangs.length === 0) {
      setError("Please select at least one target language");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!isRetry) {
      setRetryCount(0);
    }

    setTranslating(true);
    setError(null);
    setResults([]);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 25, 100));
      }, 300);

      const response = await api.translate({
        text,
        target_languages: targetLangs.map((l) => l.code),
        source_language: sourceLang === "auto" ? null : sourceLang,
        preserve_formatting: true,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const translationResults: TranslationResult[] = targetLangs.map((lang) => {
        const translatedText = response.translations[lang.code] || "Translation unavailable";
        const quality = response.quality_scores[lang.code] || 0;
        return {
          code: lang.code,
          name: lang.name,
          flag: lang.flag,
          text: translatedText,
          quality: quality * 100,
        };
      });

      setResults(translationResults);

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now(),
        sourceText: text,
        targetLanguages: targetLangs.map(l => l.code),
        timestamp: new Date().toISOString(),
      };
      const newHistory = [historyItem, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('translationHistory', JSON.stringify(newHistory));

      // Reset voice flag if auto-translating
      if (isFromVoice) {
        setIsFromVoice(false);
        setIsAutoTranslating(false);
      }

    } catch (err: any) {
      const errorMessage = err.message || "Translation failed. Please try again.";
      
      // Parse error to determine if it's retryable
      const isRetryable = 
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Cannot reach") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("HTTP 5");

      if (isRetryable && retryCount < 3) {
        console.warn(`⚠️ Retryable error, attempt ${retryCount + 1}/3:`, errorMessage);
        setRetryCount(retryCount + 1);
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, retryCount) * 1000;
        setError(`${errorMessage}. Retrying in ${delayMs / 1000}s...`);
        
        setTimeout(() => {
          handleTranslate(true);
        }, delayMs);
      } else {
        // Give up or permanent error
        const finalMessage = retryCount >= 3 
          ? `${errorMessage} (Failed after 3 retries)`
          : errorMessage;
        
        setError(finalMessage);
        console.error("Translation error:", err);
      }
    } finally {
      setTranslating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }

  // Auto-translate when transcription completes
  async function handleTranscriptionComplete() {
    if (text.trim() && targetLangs.length > 0 && results.length === 0) {
      setIsAutoTranslating(true);
      // Give a brief moment for UI to update, then auto-translate
      setTimeout(() => {
        handleTranslate();
      }, 500);
    }
  }

  const clearAll = () => {
    setText("");
    setResults([]);
    setError(null);
    setIsFromVoice(false);
  };

  const exportResults = () => {
    if (results.length === 0) {
      setError("No translations to export");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const exportText = results.map(r => `${r.name}: ${r.text}`).join('\n');
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('translationHistory');
  };

  const reuseTranslation = (item: HistoryItem) => {
    setText(item.sourceText);
    const langs = item.targetLanguages.map(code => {
      const lang = availableLanguages.find(l => l.code === code);
      return lang || { code, name: code.toUpperCase(), flag: "🏳️" };
    });
    setTargetLangs(langs);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI-Powered Translation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Translate to multiple languages instantly with ROMA framework
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg"
          >
            ❌ {error}
          </motion.div>
        )}

        {/* Main Translation Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          {/* Language Selectors */}
          <div className="flex items-center gap-4 mb-6">
            {/* Source Language */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-2xl">{getLanguageFlag(sourceLang)}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{getLanguageName(sourceLang)}</span>
                </span>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSourceDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { setSourceLang("auto"); setShowSourceDropdown(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    <span className="text-2xl">🌍</span>
                    <span className="text-gray-900 dark:text-white">Auto-detect</span>
                  </button>
                  {availableLanguages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setSourceLang(lang.code); setShowSourceDropdown(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="text-gray-900 dark:text-white">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Icon */}
            <motion.button 
              onClick={() => {
                if (targetLangs.length === 1) {
                  setSourceLang(targetLangs[0].code);
                  setTargetLangs([{ code: sourceLang === "auto" ? "en" : sourceLang, name: getLanguageName(sourceLang === "auto" ? "en" : sourceLang), flag: getLanguageFlag(sourceLang === "auto" ? "en" : sourceLang) }]);
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={targetLangs.length !== 1}
              title={targetLangs.length === 1 ? "Swap languages" : "Works with one target language"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </motion.button>

            {/* Target Languages */}
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              {targetLangs.map(lang => (
                <div key={lang.code} className="flex items-center gap-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{lang.name}</span>
                  <button
                    onClick={() => removeLanguage(lang.code)}
                    className="ml-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add Language Button */}
              <button
                onClick={() => setShowAddLanguage(!showAddLanguage)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">+ Add</span>
              </button>
            </div>
          </div>

          {/* Add Language Dropdown */}
          {showAddLanguage && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {availableLanguages.filter(l => !targetLangs.find(t => t.code === l.code)).map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => addLanguage(lang)}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition"
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Input with Voice Recorder */}
          <div className="mb-6">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                maxLength={maxChars}
                className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-base p-4 rounded-lg border border-gray-300 dark:border-gray-600 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter text to translate... or use voice input 🎙️"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {charCount}/{maxChars}
                </div>
              </div>
            </div>
          </div>

          {/* Voice Recorder */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">🎙️ Voice Input</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Record or upload audio to transcribe and translate automatically
                </p>
              </div>
              <VoiceRecorder
                targetLanguages={targetLangs}
                onTranscribe={(transcribedText) => {
                  setText(transcribedText);
                  setIsFromVoice(true);
                }}
                onTranscribeComplete={handleTranscriptionComplete}
                onError={(err) => {
                  setError(err);
                  setTimeout(() => setError(null), 5000);
                }}
                onLoading={(loading) => {
                  setTranslating(loading);
                }}
              />
            </div>
          </div>

          {/* Auto-Translating State */}
          {isFromVoice && isAutoTranslating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Auto-translating...
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Translating to {targetLangs.length} language{targetLangs.length > 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Translate Button for Voice Input */}
          {isFromVoice && text.trim() && targetLangs.length > 0 && results.length === 0 && !isAutoTranslating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Ready to translate
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your audio has been transcribed. Click translate or we'll translate automatically in a moment.
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => {
                  setIsAutoTranslating(true);
                  handleTranslate(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={translating}
                className="flex-shrink-0 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translating ? "Translating..." : "Translate Now"}
              </motion.button>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
              >
                Clear
              </button>
              <button
                onClick={exportResults}
                disabled={results.length === 0}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export
              </button>
            </div>

            <button
              onClick={() => handleTranslate(false)}
              disabled={translating || !text.trim() || targetLangs.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {translating ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Translating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Translate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {translating && progress > 0 && (
          <div className="mb-8">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Translation Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Translation Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result, idx) => (
                <motion.div
                  key={result.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{result.flag}</span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{result.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{result.code.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="text-green-600 dark:text-green-400 font-semibold text-sm">
                      {result.quality.toFixed(0)}%
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3 min-h-[60px]">{result.text}</p>
                  <motion.button
                    onClick={() => {
                      navigator.clipboard.writeText(result.text);
                      setCopiedIndex(idx);
                      setTimeout(() => setCopiedIndex(null), 2000);
                    }}
                    whileHover={{ scale: 1.05 }}
                    className={`flex items-center gap-1 text-sm font-medium transition ${
                      copiedIndex === idx
                        ? "text-green-600 dark:text-green-400"
                        : "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={copiedIndex === idx 
                          ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        }
                      />
                    </svg>
                    {copiedIndex === idx ? "Copied!" : "Copy"}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Translation History */}
        {history.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Translations</h2>
              <button
                onClick={clearHistory}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => reuseTranslation(item)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium mb-1">{item.sourceText.substring(0, 100)}{item.sourceText.length > 100 ? '...' : ''}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>→</span>
                        <span>{item.targetLanguages.join(', ').toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}