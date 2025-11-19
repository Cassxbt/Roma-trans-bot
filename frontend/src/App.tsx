import { useState } from "react";
import { Route, Routes, Link, useLocation } from "react-router-dom";
import { useTheme } from "./theme";
import Home from "./pages/Home";
import Translate from "./pages/Translate";
import Features from "./pages/Features";
import Docs from "./pages/Docs";

function Navbar() {
    const [theme, toggle] = useTheme();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const getLinkClass = (path: string) => {
        if (isActive(path)) {
            return "text-blue-600 dark:text-blue-400 font-medium hover:underline";
        }
        return "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors";
    };

    return (
        <header className="sticky top-0 z-50 backdrop-blur bg-darkBg/40 dark:bg-darkBg/40 text-darkText data-[theme=light]:bg-lightBg/80">
            <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 sm:gap-3">
                    <img src="/LOGO.PNG" alt="Transent Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover" />
                    <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-xl sm:text-2xl font-bold gradient-text">Transent</span>
                        <span className="hidden sm:inline text-sm text-gray-400">App</span>
                    </div>
                </Link>

                {/* Mobile menu button */}
                <button className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>

                {/* Desktop menu */}
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/" className={getLinkClass("/")}>Home</Link>
                    <Link to="/translate" className={getLinkClass("/translate")}>Translate</Link>
                    <Link to="/features" className={getLinkClass("/features")}>Features</Link>
                    <Link to="/docs" className={getLinkClass("/docs")}>Docs</Link>
                    <button aria-label="Toggle theme" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={toggle}>
                        <span className={theme === "light" ? "" : "hidden"}>🌙</span>
                        <span className={theme === "dark" ? "" : "hidden"}>☀️</span>
                    </button>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:hidden">
                        <div className="flex flex-col gap-4 p-4">
                            <Link to="/" className={getLinkClass("/")} onClick={() => setMenuOpen(false)}>Home</Link>
                            <Link to="/translate" className={getLinkClass("/translate")} onClick={() => setMenuOpen(false)}>Translate</Link>
                            <Link to="/features" className={getLinkClass("/features")} onClick={() => setMenuOpen(false)}>Features</Link>
                            <Link to="/docs" className={getLinkClass("/docs")} onClick={() => setMenuOpen(false)}>Docs</Link>
                            <button aria-label="Toggle theme" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-fit" onClick={toggle}>
                                <span className={theme === "light" ? "" : "hidden"}>🌙</span>
                                <span className={theme === "dark" ? "" : "hidden"}>☀️</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}

function Footer() {
    return (
        <footer className="bg-gray-900 dark:bg-black text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <img src="/LOGO.PNG" alt="Transent Logo" className="w-12 h-12 rounded-lg object-cover" />
                        <div className="text-2xl font-bold gradient-text">Transent App</div>
                    </div>

                    {/* Social Icons */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <a
                            href="https://discord.com/oauth2/authorize?client_id=1437098473915678822&permissions=379968&integration_type=0&scope=bot+applications.commands"
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center transition-colors"
                            aria-label="Discord"
                        >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                        </a>
                        <a
                            href="https://t.me/Transent_bot"
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors"
                            aria-label="Telegram"
                        >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                        </a>
                        <a
                            href="https://x.com/cassxbt"
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                            aria-label="X (Twitter)"
                        >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.627l-5.1-6.658-5.848 6.658H2.422l7.723-8.835L1.254 2.25h6.554l4.882 6.479L17.502 2.25h.742zm-1.161 17.52h1.833L7.084 4.126H5.117l12.926 15.644z" />
                            </svg>
                        </a>
                    </div>

                    <p className="text-gray-400 dark:text-gray-500 mb-4">
                        AI-powered multi-translation agent
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-600">
                        © 2025 Transent App. Built with 💜 by cassxbt.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default function App() {
    return (
        <div className="min-h-screen bg-darkBg text-darkText" id="app">
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/translate" element={<Translate />} />
                <Route path="/features" element={<Features />} />
                <Route path="/docs" element={<Docs />} />
            </Routes>
            <Footer />
        </div>
    );
}
