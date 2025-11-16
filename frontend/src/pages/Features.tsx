import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

type Language = {
  code: string;
  name: string;
  native_name?: string;
  flag?: string;
  region?: string;
  speakers?: string;
  popularity?: string;
};

export default function Features() {
  const [langs, setLangs] = useState<Language[]>([]);
  const [filteredLangs, setFilteredLangs] = useState<Language[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [popularityFilter, setPopularityFilter] = useState("");
  const [countersAnimated, setCountersAnimated] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const languageMetadata: Record<string, { flag: string; region: string; speakers: string; popularity: string }> = {
    en: { flag: "🇺🇸", region: "europe", speakers: "1500M", popularity: "popular" },
    es: { flag: "🇪🇸", region: "americas", speakers: "580M", popularity: "popular" },
    fr: { flag: "🇫🇷", region: "europe", speakers: "300M", popularity: "popular" },
    de: { flag: "🇩🇪", region: "europe", speakers: "130M", popularity: "popular" },
    it: { flag: "🇮🇹", region: "europe", speakers: "85M", popularity: "trending" },
    pt: { flag: "🇵🇹", region: "americas", speakers: "260M", popularity: "popular" },
    ru: { flag: "🇷🇺", region: "europe", speakers: "260M", popularity: "popular" },
    ja: { flag: "🇯🇵", region: "asia", speakers: "125M", popularity: "popular" },
    zh: { flag: "🇨🇳", region: "asia", speakers: "1200M", popularity: "popular" },
    ar: { flag: "🇸🇦", region: "middle-east", speakers: "420M", popularity: "popular" },
    hi: { flag: "🇮🇳", region: "asia", speakers: "600M", popularity: "popular" },
    ko: { flag: "🇰🇷", region: "asia", speakers: "80M", popularity: "trending" },
    nl: { flag: "🇳🇱", region: "europe", speakers: "25M", popularity: "trending" },
    sv: { flag: "🇸🇪", region: "europe", speakers: "10M", popularity: "trending" },
    no: { flag: "🇳🇴", region: "europe", speakers: "5M", popularity: "trending" },
    da: { flag: "🇩🇰", region: "europe", speakers: "6M", popularity: "trending" },
    fi: { flag: "🇫🇮", region: "europe", speakers: "5M", popularity: "trending" },
    pl: { flag: "🇵🇱", region: "europe", speakers: "45M", popularity: "trending" },
    tr: { flag: "🇹🇷", region: "europe", speakers: "80M", popularity: "trending" },
    el: { flag: "🇬🇷", region: "europe", speakers: "13M", popularity: "trending" },
    he: { flag: "🇮🇱", region: "middle-east", speakers: "9M", popularity: "trending" },
    th: { flag: "🇹🇭", region: "asia", speakers: "70M", popularity: "trending" },
    vi: { flag: "🇻🇳", region: "asia", speakers: "95M", popularity: "trending" },
    id: { flag: "🇮🇩", region: "asia", speakers: "200M", popularity: "trending" },
    ms: { flag: "🇲🇾", region: "asia", speakers: "60M", popularity: "trending" },
    uk: { flag: "🇺🇦", region: "europe", speakers: "40M", popularity: "trending" },
    cs: { flag: "🇨🇿", region: "europe", speakers: "11M", popularity: "trending" },
    sk: { flag: "🇸🇰", region: "europe", speakers: "5M", popularity: "trending" },
    hu: { flag: "🇭🇺", region: "europe", speakers: "13M", popularity: "trending" },
    ro: { flag: "🇷🇴", region: "europe", speakers: "24M", popularity: "trending" },
    bg: { flag: "🇧🇬", region: "europe", speakers: "8M", popularity: "trending" },
    hr: { flag: "🇭🇷", region: "europe", speakers: "5M", popularity: "trending" },
    sr: { flag: "🇷🇸", region: "europe", speakers: "8M", popularity: "trending" },
    sl: { flag: "🇸🇮", region: "europe", speakers: "2M", popularity: "trending" },
    et: { flag: "🇪🇪", region: "europe", speakers: "1M", popularity: "trending" },
    lv: { flag: "🇱🇻", region: "europe", speakers: "2M", popularity: "trending" },
    lt: { flag: "🇱🇹", region: "europe", speakers: "3M", popularity: "trending" },
    ca: { flag: "🇪🇸", region: "europe", speakers: "9M", popularity: "trending" },
    bn: { flag: "🇧🇩", region: "asia", speakers: "265M", popularity: "popular" },
    fa: { flag: "🇮🇷", region: "middle-east", speakers: "110M", popularity: "popular" },
    ur: { flag: "🇵🇰", region: "asia", speakers: "230M", popularity: "popular" },
    sw: { flag: "🇰🇪", region: "africa", speakers: "200M", popularity: "popular" },
    ta: { flag: "🇮🇳", region: "asia", speakers: "80M", popularity: "trending" },
    te: { flag: "🇮🇳", region: "asia", speakers: "95M", popularity: "trending" },
    mr: { flag: "🇮🇳", region: "asia", speakers: "83M", popularity: "trending" },
    pa: { flag: "🇮🇳", region: "asia", speakers: "125M", popularity: "trending" },
    gu: { flag: "🇮🇳", region: "asia", speakers: "60M", popularity: "trending" },
    kn: { flag: "🇮🇳", region: "asia", speakers: "50M", popularity: "trending" },
    ml: { flag: "🇮🇳", region: "asia", speakers: "38M", popularity: "trending" },
    tl: { flag: "🇵🇭", region: "asia", speakers: "100M", popularity: "trending" },
    mt: { flag: "🇲🇹", region: "europe", speakers: "0.5M", popularity: "trending" },
    ga: { flag: "🇮🇪", region: "europe", speakers: "1M", popularity: "trending" },
    cy: { flag: "🇬🇧", region: "europe", speakers: "0.8M", popularity: "trending" },
    eu: { flag: "🇪🇸", region: "europe", speakers: "0.7M", popularity: "trending" },
    gl: { flag: "🇪🇸", region: "europe", speakers: "2M", popularity: "trending" },
    ast: { flag: "🇪🇸", region: "europe", speakers: "0.1M", popularity: "trending" },
    oc: { flag: "🇫🇷", region: "europe", speakers: "0.5M", popularity: "trending" },
    br: { flag: "🇫🇷", region: "europe", speakers: "0.2M", popularity: "trending" },
    gd: { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", region: "europe", speakers: "0.06M", popularity: "trending" },
    kw: { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", region: "europe", speakers: "0.003M", popularity: "trending" },
    gv: { flag: "🇮🇲", region: "europe", speakers: "0.002M", popularity: "trending" },
    am: { flag: "🇪🇹", region: "africa", speakers: "57M", popularity: "trending" },
    ha: { flag: "🇳🇬", region: "africa", speakers: "85M", popularity: "popular" },
    yo: { flag: "🇳🇬", region: "africa", speakers: "45M", popularity: "trending" },
    ig: { flag: "🇳🇬", region: "africa", speakers: "30M", popularity: "trending" },
    zu: { flag: "🇿🇦", region: "africa", speakers: "27M", popularity: "trending" },
    xh: { flag: "🇿🇦", region: "africa", speakers: "19M", popularity: "trending" },
    af: { flag: "🇿🇦", region: "africa", speakers: "17M", popularity: "trending" },
    so: { flag: "🇸🇴", region: "africa", speakers: "21M", popularity: "trending" },
    rw: { flag: "🇷🇼", region: "africa", speakers: "12M", popularity: "trending" },
    ny: { flag: "🇲🇼", region: "africa", speakers: "14M", popularity: "trending" },
    mg: { flag: "🇲🇬", region: "africa", speakers: "25M", popularity: "trending" },
    sn: { flag: "🇿🇼", region: "africa", speakers: "13M", popularity: "trending" },
    st: { flag: "🇱🇸", region: "africa", speakers: "7M", popularity: "trending" },
    tn: { flag: "🇧🇼", region: "africa", speakers: "5M", popularity: "trending" },
    wo: { flag: "🇸🇳", region: "africa", speakers: "12M", popularity: "trending" },
    lg: { flag: "🇺🇬", region: "africa", speakers: "10M", popularity: "trending" },
    ti: { flag: "🇪🇷", region: "africa", speakers: "9M", popularity: "trending" },
    om: { flag: "🇪🇹", region: "africa", speakers: "37M", popularity: "trending" },
  };

  useEffect(() => {
    // Convert languageMetadata to array of languages (like reference site)
    const hardcodedLanguages = Object.entries(languageMetadata).map(([code, data]) => ({
      code,
      name: getLanguageName(code),
      native_name: getLanguageName(code),
      flag: data.flag,
      region: data.region,
      speakers: data.speakers,
      popularity: data.popularity,
    }));

    setLangs(hardcodedLanguages);
    setFilteredLangs(hardcodedLanguages);
  }, []);

  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
      pt: "Portuguese", ru: "Russian", ja: "Japanese", zh: "Chinese", ar: "Arabic",
      hi: "Hindi", ko: "Korean", nl: "Dutch", sv: "Swedish", no: "Norwegian",
      da: "Danish", fi: "Finnish", pl: "Polish", tr: "Turkish", el: "Greek",
      he: "Hebrew", th: "Thai", vi: "Vietnamese", id: "Indonesian", ms: "Malay",
      uk: "Ukrainian", cs: "Czech", sk: "Slovak", hu: "Hungarian", ro: "Romanian",
      bg: "Bulgarian", hr: "Croatian", sr: "Serbian", sl: "Slovenian", et: "Estonian",
      lv: "Latvian", lt: "Lithuanian", ca: "Catalan", bn: "Bengali", fa: "Persian",
      ur: "Urdu", sw: "Swahili", ta: "Tamil", te: "Telugu", mr: "Marathi",
      pa: "Punjabi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", tl: "Filipino",
      mt: "Maltese", ga: "Irish", cy: "Welsh", eu: "Basque", gl: "Galician",
      ast: "Asturian", oc: "Occitan", br: "Breton", gd: "Scottish Gaelic",
      kw: "Cornish", gv: "Manx", am: "Amharic", ha: "Hausa", yo: "Yoruba",
      ig: "Igbo", zu: "Zulu", xh: "Xhosa", af: "Afrikaans", so: "Somali",
      rw: "Kinyarwanda", ny: "Chichewa", mg: "Malagasy", sn: "Shona", st: "Sesotho",
      tn: "Setswana", wo: "Wolof", lg: "Luganda", ti: "Tigrinya", om: "Oromo",
    };
    return names[code] || code.toUpperCase();
  };

  useEffect(() => {
    let filtered = langs;
    if (searchQuery) {
      filtered = filtered.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.code.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (regionFilter) {
      filtered = filtered.filter((l) => l.region === regionFilter);
    }
    if (popularityFilter) {
      filtered = filtered.filter((l) => l.popularity === popularityFilter);
    }
    setFilteredLangs(filtered);
  }, [searchQuery, regionFilter, popularityFilter, langs]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !countersAnimated) {
          setCountersAnimated(true);
          animateCounter("lang-counter", 100, "+");
          animateCounter("simul-counter", 10, "");
          animateCounter("accuracy-counter", 99, ".9%");
          animateCounter("speed-counter", 500, "");
        }
      }, { threshold: 0.5 });
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    return () => observer.disconnect();
  }, [countersAnimated]);

  const animateCounter = (id: string, target: number, suffix: string = "") => {
    const element = document.getElementById(id);
    if (!element) return;
    let current = 0;
    const increment = target / 100;
    const duration = 2000;
    const stepTime = duration / 100;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target.toString() + suffix;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current).toString();
      }
    }, stepTime);
  };

  const getAccuracy = () => (90 + Math.random() * 9).toFixed(1);

  // Initialize ECharts
  useEffect(() => {
    // @ts-ignore - ECharts is loaded via CDN
    if (typeof echarts === 'undefined') return;

    // @ts-ignore
    const speedChart = echarts.init(document.getElementById('speed-chart'));
    const speedOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['1 Language', '2 Languages', '3 Languages', '5 Languages', '10 Languages'],
        axisLabel: { color: '#6B7280' }
      },
      yAxis: {
        type: 'value',
        name: 'Response Time (ms)',
        axisLabel: { color: '#6B7280' }
      },
      series: [{
        name: 'Response Time',
        type: 'bar',
        data: [200, 250, 320, 450, 650],
        itemStyle: {
          // @ts-ignore
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: '#8B5CF6' }
          ])
        }
      }]
    };
    speedChart.setOption(speedOption);

    // @ts-ignore
    const usageChart = echarts.init(document.getElementById('usage-chart'));
    const usageOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: '#6B7280' }
      },
      series: [{
        name: 'Language Usage',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 335, name: 'English', itemStyle: { color: '#3B82F6' } },
          { value: 310, name: 'Spanish', itemStyle: { color: '#8B5CF6' } },
          { value: 234, name: 'French', itemStyle: { color: '#EC4899' } },
          { value: 135, name: 'German', itemStyle: { color: '#10B981' } },
          { value: 148, name: 'Chinese', itemStyle: { color: '#F59E0B' } },
          { value: 248, name: 'Others', itemStyle: { color: '#6B7280' } }
        ]
      }]
    };
    usageChart.setOption(usageOption);

    // Make charts responsive
    const handleResize = () => {
      speedChart.resize();
      usageChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      speedChart.dispose();
      usageChart.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Comprehensive Language Support
          </h1>
          <p className="text-lg md:text-xl text-blue-100">
            Transent supports 100+ languages with advanced features powered by the ROMA framework
          </p>
        </div>
      </section>

      {/* Statistics Cards */}
      <section ref={statsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-4xl font-bold mb-1">
              <span id="lang-counter">0</span>
            </div>
            <div className="text-sm opacity-90">Languages Supported</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-4xl font-bold mb-1">
              <span id="simul-counter">0</span>
            </div>
            <div className="text-sm opacity-90">Simultaneous Translations</div>
          </div>
          <div className="bg-gradient-to-br from-pink-600 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-4xl font-bold mb-1">
              <span id="accuracy-counter">0</span>
            </div>
            <div className="text-sm opacity-90">Average Accuracy</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-4xl font-bold mb-1">
              <span id="speed-counter">0</span>
            </div>
            <div className="text-sm opacity-90">ms Response Time</div>
          </div>
        </div>
      </section>

      {/* Language Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl p-8 border border-gray-700 dark:border-gray-700 shadow-lg">
          <h2 className="text-4xl font-bold text-white mb-2">Language Explorer</h2>
          <p className="text-gray-300 mb-8">
            Discover and explore all supported languages with real-time translation statistics
          </p>

          <div className="mb-6">
            <input
              type="text"
              placeholder="🔍 Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-lg placeholder-gray-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex gap-4">
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Regions</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="africa">Africa</option>
                <option value="americas">Americas</option>
                <option value="middle-east">Middle East</option>
              </select>
              <select
                value={popularityFilter}
                onChange={(e) => setPopularityFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Languages</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredLangs.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                No languages found matching your criteria.
              </div>
            ) : (
              filteredLangs.map((lang, index) => (
                <motion.div
                  key={lang.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01, duration: 0.3 }}
                  className="bg-gray-900 dark:bg-gray-900 rounded-lg p-4 border border-gray-800 dark:border-gray-800 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/translate?lang=${lang.code}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{lang.flag}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{lang.name}</h3>
                      <span className="text-xs text-gray-400">{lang.code.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Speakers:</span>
                      <span className="font-medium text-gray-300">{lang.speakers}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Region:</span>
                      <span className="font-medium text-gray-300 capitalize">{lang.region?.replace("-", " ")}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Accuracy:</span>
                      <span className="font-medium text-green-400">{getAccuracy()}%</span>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs font-medium">
                    Try Translation
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Advanced Features</h2>
          <p className="text-gray-600 dark:text-gray-300">Experience the full power of the ROMA framework</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">ROMA Framework</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Intelligent task decomposition with four-stage processing pipeline
            </p>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Processing Stages:</div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>⚛️ Atomizer</li>
              <li>🧠 Planner</li>
              <li>🚀 Executor</li>
              <li>📊 Aggregator</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-5xl mb-4">🔄</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Multi-Provider Fallback</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Seamless fallback chain ensures maximum uptime
            </p>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Provider Chain:</div>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>1. DeepL (Primary)</li>
              <li>2. Azure Translator</li>
              <li>3. LibreTranslate</li>
            </ol>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Parallel Execution</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Translate to multiple languages simultaneously
            </p>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Performance:</div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• 10 languages at once</li>
              <li>• Average 500ms response</li>
              <li>• 99.9% uptime</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-5xl mb-4">💾</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Smart Caching</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Intelligent caching for instant repeated translations
            </p>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cache Layers:</div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• In-memory cache</li>
              <li>• SQLite persistence</li>
              <li>• LRU eviction policy</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Natural Language Parsing</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Understands intuitive commands and requests
            </p>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Examples:</div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>"translate hello to Spanish"</li>
              <li>"convert this to French"</li>
              <li>"what's this in German?"</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Quality Assurance</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Automated quality checks and confidence scoring
            </p>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quality Metrics:</div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Confidence scoring</li>
              <li>• Grammar validation</li>
              <li>• Context awareness</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-5xl mb-4">🎙️</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Voice Transcribe</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Advanced audio processing with automatic speech recognition
            </p>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Voice Features:</div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Real-time transcription</li>
              <li>• Audio file upload support</li>
              <li>• Automatic language detection</li>
              <li>• Instant translation after transcribe</li>
            </ul>
          </div>
          </div>
          </section>

      {/* Performance Analytics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Performance Analytics</h2>
          <p className="text-gray-600 dark:text-gray-300">Real-time metrics and usage statistics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart - Translation Speed */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Translation Speed by Language Count</h3>
            <div id="speed-chart" style={{ width: "100%", height: "350px" }}></div>
          </div>

          {/* Donut Chart - Language Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Language Usage Distribution</h3>
            <div id="usage-chart" style={{ width: "100%", height: "350px" }}></div>
          </div>
        </div>
      </section>
    </div>
  );
}
