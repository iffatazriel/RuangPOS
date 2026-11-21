export type Theme = "light" | "dark";
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#f4f6fb" : "#212121");
}
export function initialTheme(): Theme {
  try {
    return localStorage.getItem("ruangpos-theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
