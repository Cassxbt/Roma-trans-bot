import { Route, Routes, Link, useLocation } from "react-router-dom";
import { useTheme } from "./theme";
import Home from "./pages/Home";
import Translate from "./pages/Translate";
import Features from "./pages/Features";
import Docs from "./pages/Docs";

function Navbar() {
  const [theme, toggle] = useTheme();
  const location = useLocation();

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
        <Link to="/" className="flex items-center gap-3">
          <img src="/LOGO.PNG" alt="Transent Logo" className="w-10 h-10 rounded-lg object-cover" />
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold gradient-text">Transent</span>
            <span className="text-sm text-gray-400">App</span>
          </div>
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/" className={getLinkClass("/")}>Home</Link>
          <Link to="/translate" className={getLinkClass("/translate")}>Translate</Link>
          <Link to="/features" className={getLinkClass("/features")}>Features</Link>
          <Link to="/docs" className={getLinkClass("/docs")}>Docs</Link>
          <button aria-label="Toggle theme" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={toggle}>
            <span className={theme === "light" ? "" : "hidden"}>🌙</span>
            <span className={theme === "dark" ? "" : "hidden"}>☀️</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/LOGO.PNG" alt="Transent Logo" className="w-12 h-12 rounded-lg object-cover" />
            <div className="text-2xl font-bold gradient-text">Transent App</div>
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
