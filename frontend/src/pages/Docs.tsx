import { useEffect, useState } from "react";
import { api } from "../api/client";

type CodeBlockProps = {
  title: string;
  code: string;
  onCopy: (code: string) => void;
};

function CodeBlock({ title, code, onCopy }: CodeBlockProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
        <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 px-4 py-2 border-b border-gray-700">
          <span className="text-sm text-gray-400">Terminal</span>
          <button
            onClick={() => onCopy(code)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Copy
          </button>
        </div>
        <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    api.health().then((h) => setStatus(h)).catch(() => {});
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <aside className="hidden lg:block w-80 h-screen fixed left-0 top-0 overflow-y-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 p-6 pt-24">
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documentation</h3>
          <nav className="space-y-1">
            {["getting-started", "installation", "configuration", "usage", "api-reference", "bot-commands", "examples"].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                onClick={() => setActiveSection(section)}
                className={`block px-4 py-2 rounded-lg transition-colors capitalize ${
                  activeSection === section
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700"
                }`}
              >
                {section.replace(/-/g, " ")}
              </a>
            ))}
          </nav>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">API Endpoints</h4>
          <nav className="space-y-1">
            {[
              { name: "POST /translate", id: "translate-endpoint" },
              { name: "POST /detect", id: "detect-endpoint" },
              { name: "POST /transcribe", id: "transcribe-endpoint" },
              { name: "GET /languages", id: "languages-endpoint" },
              { name: "GET /health", id: "health-endpoint" },
            ].map((endpoint) => (
              <a
                key={endpoint.id}
                href={`#${endpoint.id}`}
                className="block px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {endpoint.name}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Links</h4>
          <nav className="space-y-1">
            <a
              href="https://github.com/Cassxbt/Roma-trans-bot"
              target="_blank"
              rel="noreferrer"
              className="block px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              GitHub Repository
            </a>
          </nav>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80">
        <section className="py-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Documentation</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Complete guide to using Transent's translation platform
            </p>
            {status && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">API Status: {status.status}</span>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          <section id="getting-started">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Getting Started</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Transent is a powerful translation platform powered by the ROMA framework, supporting 100+ languages
              with intelligent multi-provider orchestration.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Key Features</h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li>• <strong>ROMA Framework:</strong> Intelligent task decomposition and parallel processing</li>
                <li>• <strong>Multi-Provider:</strong> DeepL → Azure → LibreTranslate fallback chain</li>
                <li>• <strong>100+ Languages:</strong> Comprehensive language support</li>
                <li>• <strong>Voice Transcription:</strong> Real-time audio to text conversion with automatic language detection</li>
                <li>• <strong>Real-time Processing:</strong> Average 500ms response time</li>
                <li>• <strong>Smart Caching:</strong> Instant repeated translations</li>
              </ul>
            </div>
          </section>

          <section id="installation">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Installation</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Prerequisites</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Python 3.12 or higher</li>
                  <li>pip package manager</li>
                  <li>Git (for cloning the repository)</li>
                </ul>
              </div>

              <CodeBlock
                title="Clone Repository"
                code="git clone https://github.com/Cassxbt/Roma-trans-bot.git\ncd Roma-trans-bot"
                onCopy={copyCode}
              />

              <CodeBlock
                title="Create Virtual Environment"
                code="python3 -m venv venv\nsource venv/bin/activate  # On Windows: venv\\Scripts\\activate"
                onCopy={copyCode}
              />

              <CodeBlock title="Install Dependencies" code="pip install -r requirements.txt" onCopy={copyCode} />
            </div>
          </section>

          <section id="configuration">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Configuration</h2>
            <div className="space-y-6">
              <CodeBlock title="Environment Setup" code="cp .env.example .env" onCopy={copyCode} />

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Required API Keys</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You need at least one API key for the service to work. We recommend getting keys from multiple
                  providers for better reliability.
                </p>
                <CodeBlock
                  title="API Keys Configuration"
                  code="DEEPL_API_KEY=your_deepl_api_key_here\nAZURE_TRANSLATOR_KEY=your_azure_key_here\nAZURE_TRANSLATOR_REGION=your_azure_region\nLIBRETRANSLATE_URL=https://libretranslate.de"
                  onCopy={copyCode}
                />
              </div>
            </div>
          </section>

          <section id="usage">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Usage</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Running the Application</h3>
                <CodeBlock title="Running the Discord Bot" code="python run_discord_bot.py" onCopy={copyCode} />
                <CodeBlock title="Running the Telegram Bot" code="python run_telegram_bot.py" onCopy={copyCode} />
                <CodeBlock title="Running the API Server" code="python run_api.py" onCopy={copyCode} />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Web Interface</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  The Transent web application is available at <code className="bg-gray-900 px-2 py-1 rounded text-blue-400">http://localhost:5000</code> and provides:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li><strong>Text Translation:</strong> Translate text to multiple languages simultaneously</li>
                  <li><strong>Voice Input:</strong> Record audio or upload files for instant transcription and translation</li>
                  <li><strong>Language Explorer:</strong> Browse all 100+ supported languages with metadata</li>
                  <li><strong>Translation History:</strong> Access recent translations for quick reuse</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="api-reference">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">API Reference</h2>
            <div className="space-y-8">
              <div id="translate-endpoint" className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">POST /api/v1/translate</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Translate text to multiple languages</p>
                <CodeBlock
                  title="Request"
                  code='{\n  "text": "Hello world",\n  "target_languages": ["es", "fr"],\n  "source_language": "en",\n  "preserve_formatting": true\n}'
                  onCopy={copyCode}
                />
              </div>

              <div id="detect-endpoint" className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">POST /api/v1/detect</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Detect the language of text</p>
                <CodeBlock title="Request" code='{ "text": "Bonjour le monde" }' onCopy={copyCode} />
              </div>

              <div id="languages-endpoint" className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">GET /api/v1/languages</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Get list of supported languages</p>
              </div>

              <div id="health-endpoint" className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">GET /api/v1/health</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Check API health status</p>
              </div>

              <div id="transcribe-endpoint" className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">POST /api/v1/transcribe</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Transcribe audio file to text with optional language detection</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Request: Form data with audio file</p>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• <strong>file:</strong> Audio file (MP3, WAV, OGG, etc.)</li>
                      <li>• <strong>language:</strong> (Optional) Target language for transcription</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Response:</p>
                    <CodeBlock
                      title="Response Example"
                      code='{\n  "text": "Hello world, this is a test",\n  "language": "en",\n  "confidence": 0.95,\n  "duration": 2.5\n}'
                      onCopy={copyCode}
                    />
                  </div>
                </div>
              </div>
              </div>
              </section>

          <section id="bot-commands">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Bot Commands & Capabilities</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Discord Bot</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Translate text with natural language commands:</p>
                <code className="text-blue-600 dark:text-blue-400">!translate Hello world to Spanish French</code>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">Also supports voice channel transcription and translation for real-time conversation translation.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Telegram Bot</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Use slash commands for translation:</p>
                <code className="text-blue-600 dark:text-blue-400">/translate Hello world to Spanish French</code>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">Send audio files directly for automatic transcription and translation.</p>
              </div>
            </div>
          </section>

          <section id="examples">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Examples</h2>
            <div className="space-y-6">
              <CodeBlock
                title="Python Example"
                code='import requests\n\nresponse = requests.post(\n    "http://localhost:5001/api/v1/translate",\n    json={\n        "text": "Hello world",\n        "target_languages": ["es", "fr", "de"],\n        "preserve_formatting": True\n    }\n)\n\nprint(response.json())'
                onCopy={copyCode}
              />

              <CodeBlock
                title="JavaScript Example"
                code="const response = await fetch('http://localhost:5001/api/v1/translate', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    text: 'Hello world',\n    target_languages: ['es', 'fr', 'de'],\n    preserve_formatting: true\n  })\n});\n\nconst data = await response.json();\nconsole.log(data);"
                onCopy={copyCode}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

