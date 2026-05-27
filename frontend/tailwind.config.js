/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        inverse: "var(--text-inverse)",
        
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        
        accent: "var(--accent)",
        accentHover: "var(--accent-hover)",
        accentDim: "var(--accent-dim)",
        accentText: "var(--accent-text)",
        
        borderSubtle: "var(--border-subtle)",
        borderDefault: "var(--border-default)",
        borderStrong: "var(--border-strong)",
        
        danger: "var(--danger)",
        dangerDim: "var(--danger-dim)",
        dangerText: "var(--danger-text)",
        
        warning: "var(--warning)",
        warningDim: "var(--warning-dim)",
        warningText: "var(--warning-text)",

        // Legacy mappings
        line: "var(--border-subtle)",
        panel: "var(--bg-surface)",
        panelAlt: "var(--bg-elevated)",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: []
};
