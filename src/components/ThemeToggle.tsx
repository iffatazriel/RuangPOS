import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, initialTheme } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState(initialTheme);
  return (
    <button
      className="icon-button theme-toggle"
      aria-label={
        theme === "light" ? "Aktifkan tema gelap" : "Aktifkan tema terang"
      }
      onClick={() => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        applyTheme(next);
        try {
          localStorage.setItem("ruangpos-theme", next);
        } catch {
          /* Storage can be unavailable. */
        }
      }}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
