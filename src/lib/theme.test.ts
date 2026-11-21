import { afterEach, expect, it, vi } from "vitest";
import { applyTheme, initialTheme } from "./theme";
afterEach(() => vi.unstubAllGlobals());
it("applies each theme and its matching browser theme color", () => {
  const setAttribute = vi.fn();
  const dataset: Record<string, string> = {};
  vi.stubGlobal("document", {
    documentElement: { dataset },
    querySelector: () => ({ setAttribute }),
  });
  applyTheme("dark");
  expect(dataset.theme).toBe("dark");
  expect(setAttribute).toHaveBeenLastCalledWith("content", "#212121");
  applyTheme("light");
  expect(dataset.theme).toBe("light");
  expect(setAttribute).toHaveBeenLastCalledWith("content", "#f4f6fb");
});
it("defaults to light and only restores an explicit dark preference", () => {
  for (const value of [null, "light", "unknown"]) {
    vi.stubGlobal("localStorage", { getItem: () => value });
    expect(initialTheme()).toBe("light");
  }
  vi.stubGlobal("localStorage", { getItem: () => "dark" });
  expect(initialTheme()).toBe("dark");
});
it("keeps light mode available when browser storage is blocked", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
  });
  expect(initialTheme()).toBe("light");
});
