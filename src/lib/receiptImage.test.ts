import { afterEach, expect, it, vi } from "vitest";
import { downloadBlob } from "./download";
import { receiptPNG, shareReceiptPNG } from "./receiptImage";
import { optionText } from "./options";

vi.mock("./download", () => ({ downloadBlob: vi.fn() }));
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });
const png = new Blob(["png"], { type: "image/png" });
it("shares a PNG file when supported without downloading a duplicate", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { canShare: () => true, share });
  await shareReceiptPNG(png, "struk.png");
  expect(share).toHaveBeenCalledWith({ files: [expect.any(File)], title: "Struk RuangPOS" });
  expect(downloadBlob).not.toHaveBeenCalled();
});
it("downloads when file sharing is absent or unsupported", async () => {
  for (const navigator of [{}, { share: vi.fn(), canShare: () => false }]) {
    vi.stubGlobal("navigator", navigator);
    await shareReceiptPNG(png, "struk.png");
  }
  expect(downloadBlob).toHaveBeenCalledTimes(2);
});
it("falls back on share failure but respects an explicit user cancellation", async () => {
  vi.stubGlobal("navigator", { canShare: () => true, share: () => Promise.reject(new DOMException("No", "NotAllowedError")) });
  await shareReceiptPNG(png, "struk.png");
  expect(downloadBlob).toHaveBeenCalledOnce();
  vi.mocked(downloadBlob).mockClear();
  vi.stubGlobal("navigator", { canShare: () => true, share: () => Promise.reject(new DOMException("Cancel", "AbortError")) });
  await shareReceiptPNG(png, "struk.png");
  expect(downloadBlob).not.toHaveBeenCalled();
});
it("rejects unsupported canvas and PNG encoding errors with actionable errors", async () => {
  vi.stubGlobal("document", { createElement: () => ({ getContext: () => null }) });
  await expect(receiptPNG("Kopi")).rejects.toThrow("Gunakan cetak");
  const context = { measureText: () => ({ width: 1 }), fillRect: vi.fn(), fillText: vi.fn() };
  vi.stubGlobal("document", { createElement: () => ({ getContext: () => context, toBlob: (callback: BlobCallback) => callback(null) }) });
  await expect(receiptPNG("Kopi")).rejects.toThrow("gagal dibuat");
});
it("renders every receipt line and rejects oversized images instead of truncating", async () => {
  const context = { measureText: (s: string) => ({ width: s.length }), fillRect: vi.fn(), fillText: vi.fn() };
  vi.stubGlobal("document", { createElement: () => ({ getContext: () => context, toBlob: (callback: BlobCallback) => callback(png) }) });
  const options = optionText({ selectedOptions: [{ group: "Ukuran", name: "Regular", priceDelta: 0 }, { group: "Topping", name: "Boba", priceDelta: 3000 }] });
  expect(await receiptPNG(`Warung\n${options}\nTOTAL`)).toBe(png);
  expect(context.fillText.mock.calls.map(call => call[0])).toEqual(["Warung", "Ukuran: Regular, Topping: Boba (+Rp3.000)", "TOTAL"]);
  await expect(receiptPNG("Kopi\n".repeat(1000))).rejects.toThrow("terlalu panjang");
});
