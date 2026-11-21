import { afterEach, expect, it, vi } from "vitest";
import { initialTheme } from "./theme";
afterEach(() => vi.unstubAllGlobals());
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
