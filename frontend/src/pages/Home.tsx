import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import RomaDemo from "../components/RomaDemo";

export default function Home() {
  const typedRef = useRef<HTMLSpanElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Typed.js
    // @ts-ignore
    if (typeof Typed !== 'undefined' && typedRef.current) {
      // @ts-ignore
      new Typed(typedRef.current, {
        strings: [
          'Enterprise-Grade Translation',
          'Powered by ROMA Framework',
          '100+ Languages Supported',
          'Multi-Provider Intelligence'
        ],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 2000,
        loop: true,
        showCursor: true,
        cursorChar: '|'
      });
    }

    // Create particles
    if (particlesRef.current) {
      const particleCount = 50;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 6}s`;
        particlesRef.current.appendChild(particle);
      }
    }

    // Animate counters
    const counters = document.querySelectorAll('.counter');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target as HTMLElement;
          const target = parseInt(counter.dataset.count || '0');

          // @ts-ignore
          if (typeof anime !== 'undefined') {
            // @ts-ignore
            anime({
              targets: { count: 0 },
              count: target,
              duration: 2000,
              easing: 'easeOutQuart',
              update: function(anim: any) {
                counter.textContent = Math.floor(anim.animatables[0].target.count).toString();
              }
            });
          }

          observer.unobserve(counter);
        }
      });
    });

    counters.forEach(counter => observer.observe(counter));

    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/frame1.png)' }}
        >
          {/* Gradient overlay for better text readability and brand colors */}
          <div className="absolute inset-0 hero-bg-overlay"></div>
        </div>

        {/* Particles */}
        <div ref={particlesRef} className="absolute inset-0 z-10"></div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Transent App
            </h1>

            <div className="h-16 mb-8">
              <span ref={typedRef} className="text-2xl md:text-3xl text-blue-400"></span>
            </div>

            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Powered by the revolutionary ROMA framework, Transent delivers enterprise-grade translations
              across 100+ languages with intelligent multi-provider orchestration, real-time processing,
              and uncompromising quality assurance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                to="/translate"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Start Translating
              </Link>
              <Link
                to="/features"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 font-semibold rounded-xl transition-all duration-300 text-lg"
              >
                Explore Features
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold text-white mb-2">
                  <span className="counter" data-count="100">0</span>+
                </div>
                <div className="text-gray-400">Languages Supported</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold text-white mb-2">
                  <span className="counter" data-count="10">0</span>
                </div>
                <div className="text-gray-400">Simultaneous Translations</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold text-white mb-2">
                  <span className="counter" data-count="99">0</span>%
                </div>
                <div className="text-gray-400">Accuracy Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive ROMA Demo Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Interactive ROMA Translation Demo
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Experience how Transent processes translations in real-time using the ROMA framework
            </p>
          </div>
          <RomaDemo />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Transent?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Experience the next generation of translation technology with features that set us apart
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">ROMA Framework</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intelligent task decomposition with Atomizer, Planner, Executor, and Aggregator stages for optimal translation quality.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Multi-Provider Fallback</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Seamless fallback chain: DeepL → Azure Translator → LibreTranslate ensures maximum uptime and quality.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Parallel Execution</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Translate to up to 10 languages simultaneously with ROMA's parallel processing architecture.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              <div className="text-5xl mb-4">💾</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Smart Caching</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intelligent caching system with SQLite and in-memory storage for instant repeated translations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Natural Language</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intuitive command parsing understands natural language requests like "translate hello to Spanish".
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Production Ready</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enterprise-grade error handling, comprehensive logging, and robust architecture ensure reliability.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bot Platforms Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Available on Your Favorite Platforms
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Access Transent's powerful translation capabilities through Discord and Telegram bots
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Discord Bot */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800 hover:shadow-xl transition-all"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Discord Bot</h3>
                  <p className="text-gray-600 dark:text-gray-400">Professional translation in Discord</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Natural language commands</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Up to 10 simultaneous languages</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Voice channel transcription & translation</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Real-time conversation translation</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Clean output with flag emojis</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>No setup required for users</span>
                </div>
              </div>

              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 mb-6">
                <code className="text-green-400 text-sm">!translate hello to Spanish French German</code>
              </div>

              <a
                href="#"
                className="block w-full text-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Add to Discord Server
              </a>
            </motion.div>
            {/* Telegram Bot */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Telegram Bot</h3>
                  <p className="text-gray-600 dark:text-gray-400">Intuitive translation on Telegram</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Intuitive command interface</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Up to 10 simultaneous languages</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Voice message transcription</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Automatic language detection</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Professional formatting</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span>Typing indicators and language detection</span>
                </div>
              </div>

              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 mb-6">
                <code className="text-green-400 text-sm">/translate hello to Spanish French German</code>
              </div>

              <a
                href="https://t.me/Transent_bot"
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Start Chat on Telegram
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
