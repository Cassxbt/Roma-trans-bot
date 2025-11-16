module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        darkBg: "#0A0E1A",
        darkBg2: "#151A2D",
        darkCard: "#1A1F35",
        darkText: "#F8FAFC",
        darkTextMuted: "#CBD5E1",
        accentDark: "#3B82F6",
        successDark: "#10B981",
        warningDark: "#F59E0B",
        lightBg: "#FEFEFE",
        lightBg2: "#F8FAFC",
        lightCard: "#FFFFFF",
        lightText: "#1E293B",
        lightTextMuted: "#475569",
        accentLight: "#2563EB",
        successLight: "#059669",
        warningLight: "#D97706"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.2)"
      }
    }
  },
  plugins: []
};
