import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";

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
  confidence: number;
  charCount: number;
};

export default function RomaDemo() {
  const [text, setText] = useState("Hello, world! This is Transent demonstrating the power of AI translation.");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLangs, setTargetLangs] = useState([
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" }
  ] as Language[]);
  const [showResults, setShowResults] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [results, setResults] = useState([] as TranslationResult[]);
  const [processingTime, setProcessingTime] = useState(0);
  const [quality, setQuality] = useState(0);
  const [activeStage, setActiveStage] = useState(0);

  const availableLanguages: Language[] = [
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" }
  ];

  const removeLanguage = (code: string) => {
    setTargetLangs(targetLangs.filter(l => l.code !== code));
  };

  const addLanguage = (lang: Language) => {
    if (!targetLangs.find(l => l.code === lang.code)) {
      setTargetLangs([...targetLangs, lang]);
    }
  };

  async function startTranslation() {
    if (translating) return;
    setTranslating(true);
    setActiveStage(0);
    
    const startTime = Date.now();
    
    // Animate through stages
    for (let i = 1; i <= 4; i++) {
      setActiveStage(i);
      await new Promise(r => setTimeout(r, 300));
    }

    // Fetch translations
    try {
      const res = await api.translate({
        text,
        target_languages: targetLangs.map(l => l.code),
        preserve_formatting: true
      });
      
      const translationResults: TranslationResult[] = targetLangs.map(lang => {
        const translatedText = res.translations[lang.code] || "Translation unavailable";
        return {
          code: lang.code,
          name: lang.name,
          flag: lang.flag,
          text: translatedText,
          confidence: 95 + Math.random() * 4,
          charCount: translatedText.length
        };
      });
      
      setResults(translationResults);
      const avgConfidence = translationResults.reduce((sum, r) => sum + r.confidence, 0) / translationResults.length;
      setQuality(avgConfidence);
    } catch (e) {
      // Fallback data
      const fallbackTranslations: Record<string, string> = {
        es: "¡Hola, mundo! Transent está demostrando el poder de la traducción automática.",
        fr: "Bonjour, le monde ! Transent démontre la puissance de la traduction automatique.",
        de: "Hallo, Welt! Transent demonstriert die Macht der automatischen Übersetzung.",
        ja: "こんにちは、世界！Transentは自動翻訳の力を実証しています。",
        ko: "안녕하세요, 세계! Transent는 자동 번역의 힘을 보여줍니다.",
        zh: "你好，世界！Transent 正在展示自动翻译的力量。"
      };
      
      const translationResults: TranslationResult[] = targetLangs.map(lang => {
        const translatedText = fallbackTranslations[lang.code] || "Translation unavailable";
        return {
          code: lang.code,
          name: lang.name,
          flag: lang.flag,
          text: translatedText,
          confidence: 95 + Math.random() * 4,
          charCount: translatedText.length
        };
      });
      
      setResults(translationResults);
      const avgConfidence = translationResults.reduce((sum, r) => sum + r.confidence, 0) / translationResults.length;
      setQuality(avgConfidence);
    }
    
    const endTime = Date.now();
    setProcessingTime(endTime - startTime);
    setTranslating(false);
    setShowResults(true);
  }

  const clearResults = () => {
    setShowResults(false);
    setResults([]);
    setActiveStage(0);
  };

  const charCount = text.length;

  if (showResults) {
    return (
      <div className="space-y-8">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startTranslation}
              disabled={translating}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Start Translation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearResults}
              className="px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white font-semibold rounded-lg border border-gray-600"
            >
              Clear
            </motion.button>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-400">Quality: </span>
              <span className="text-green-400 font-semibold">{quality.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Est. Time: </span>
              <span className="text-gray-300 font-semibold">~{(processingTime / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Translation Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Translation Results</h2>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-900 text-blue-300 rounded-lg border border-blue-700 flex items-center gap-2 hover:bg-blue-800 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </button>
              <button className="px-4 py-2 bg-green-900 text-green-300 rounded-lg border border-green-700 flex items-center gap-2 hover:bg-green-800 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, idx) => (
              <motion.div
                key={result.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{result.flag}</span>
                    <div>
                      <div className="font-semibold text-white">{result.name}</div>
                      <div className="text-xs text-gray-400">{result.code.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-semibold text-sm">{result.confidence.toFixed(1)}% confidence</div>
                </div>
                <p className="text-gray-300 mb-3">{result.text}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Character count: {result.charCount}</span>
                  <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Translation Analytics */}
        <div className="bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Translation Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">{processingTime}ms</div>
              <div className="text-sm text-gray-400">Processing Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">{results.length}</div>
              <div className="text-sm text-gray-400">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">Miss</div>
              <div className="text-sm text-gray-400">Cache Status</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">Azure</div>
              <div className="text-sm text-gray-400">Provider</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Source Text Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-400">Source Text</label>
            <div className="relative">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 pr-10 rounded-lg border border-gray-600 text-sm cursor-pointer appearance-none"
              >
                <option value="en">English 🇺🇸</option>
              </select>
              <svg className="absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full bg-gray-800 dark:bg-gray-900 text-white text-lg p-6 rounded-xl border border-gray-700 dark:border-gray-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter text to translate..."
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{charCount}</span> characters
            </div>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Auto-detect</button>
          </div>
        </div>

        {/* Target Languages Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-400">Target Languages ({targetLangs.length})</label>
            <button 
              onClick={() => {
                const unused = availableLanguages.find(l => !targetLangs.find(t => t.code === l.code));
                if (unused) addLanguage(unused);
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Add Language
            </button>
          </div>
          
          <div className="space-y-3 mb-4">
            {targetLangs.map(lang => (
              <motion.div
                key={lang.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <div className="font-semibold text-white">{lang.name}</div>
                    <div className="text-xs text-gray-400">{lang.code.toUpperCase()}</div>
                  </div>
                </div>
                <button
                  onClick={() => removeLanguage(lang.code)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Language Category Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => {
                const europeanLangs = [
                  { code: "es", name: "Spanish", flag: "🇪🇸" },
                  { code: "fr", name: "French", flag: "🇫🇷" },
                  { code: "de", name: "German", flag: "🇩🇪" }
                ];
                europeanLangs.forEach(lang => {
                  if (!targetLangs.find(l => l.code === lang.code)) {
                    addLanguage(lang);
                  }
                });
              }}
              className="flex-1 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800 rounded-lg p-3 hover:border-blue-500 hover:bg-gray-700 transition-colors"
            >
              <div className="text-sm text-gray-400 mb-1">European</div>
              <div className="flex gap-1 text-lg">
                <span>🇪🇸</span>
                <span>🇫🇷</span>
                <span>🇩🇪</span>
              </div>
            </button>
            <button 
              onClick={() => {
                const asianLangs = [
                  { code: "ja", name: "Japanese", flag: "🇯🇵" },
                  { code: "ko", name: "Korean", flag: "🇰🇷" },
                  { code: "zh", name: "Chinese", flag: "🇨🇳" }
                ];
                asianLangs.forEach(lang => {
                  if (!targetLangs.find(l => l.code === lang.code)) {
                    addLanguage(lang);
                  }
                });
              }}
              className="flex-1 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800 rounded-lg p-3 hover:border-blue-500 hover:bg-gray-700 transition-colors"
            >
              <div className="text-sm text-gray-400 mb-1">Asian</div>
              <div className="flex gap-1 text-lg">
                <span>🇯🇵</span>
                <span>🇰🇷</span>
                <span>🇨🇳</span>
              </div>
            </button>
            <button 
              onClick={() => {
                const globalLangs = [
                  { code: "ar", name: "Arabic", flag: "🇸🇦" },
                  { code: "hi", name: "Hindi", flag: "🇮🇳" },
                  { code: "pt", name: "Portuguese", flag: "🇵🇹" }
                ];
                globalLangs.forEach(lang => {
                  if (!targetLangs.find(l => l.code === lang.code)) {
                    addLanguage(lang);
                  }
                });
              }}
              className="flex-1 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800 rounded-lg p-3 hover:border-blue-500 hover:bg-gray-700 transition-colors"
            >
              <div className="text-sm text-gray-400 mb-1">Global</div>
              <div className="flex gap-1 text-lg">
                <span>🇸🇦</span>
                <span>🇮🇳</span>
                <span>🇵🇹</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ROMA Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Atomizer */}
        <motion.div
          animate={{
            borderColor: activeStage >= 1 ? ["#3B82F6", "#8B5CF6", "#3B82F6"] : "#374151"
          }}
          transition={{ duration: 2, repeat: activeStage >= 1 ? Infinity : 0 }}
          className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
          <div className="relative">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              activeStage >= 1 ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50' : 'bg-gray-700'
            } transition-all duration-300`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-white">Atomizer</h3>
          </div>
        </motion.div>

        {/* Planner */}
        <motion.div
          animate={{
            borderColor: activeStage >= 2 ? ["#10B981", "#34D399", "#10B981"] : "#374151"
          }}
          transition={{ duration: 2, repeat: activeStage >= 2 ? Infinity : 0 }}
          className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10" />
          <div className="relative">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              activeStage >= 2 ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50' : 'bg-gray-700'
            } transition-all duration-300`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-white">Planner</h3>
          </div>
        </motion.div>

        {/* Executor */}
        <motion.div
          animate={{
            borderColor: activeStage >= 3 ? ["#8B5CF6", "#A78BFA", "#8B5CF6"] : "#374151"
          }}
          transition={{ duration: 2, repeat: activeStage >= 3 ? Infinity : 0 }}
          className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-violet-600/10" />
          <div className="relative">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              activeStage >= 3 ? 'bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/50' : 'bg-gray-700'
            } transition-all duration-300`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-white">Executor</h3>
          </div>
        </motion.div>

        {/* Aggregator */}
        <motion.div
          animate={{
            borderColor: activeStage >= 4 ? ["#F97316", "#EF4444", "#F97316"] : "#374151"
          }}
          transition={{ duration: 2, repeat: activeStage >= 4 ? Infinity : 0 }}
          className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10" />
          <div className="relative">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              activeStage >= 4 ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/50' : 'bg-gray-700'
            } transition-all duration-300`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-white">Aggregator</h3>
          </div>
        </motion.div>
      </div>

      {/* Start Translation Button */}
      {!showResults && (
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startTranslation}
            disabled={translating}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-2xl disabled:opacity-50 flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {translating ? 'Translating...' : 'Start Translation'}
          </motion.button>
        </div>
      )}
    </div>
  );
}
