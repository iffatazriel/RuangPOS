import { expect, it } from "vitest";
import { normalizePhone, receiptText, whatsAppReceiptURL, wrapReceiptText } from "./receipt";
import { totals, type Sale, type Settings } from "./logic";

const settings: Settings = { name: "Warung Melati", address: "Bandung", phone: "022123456", footer: "Terima kasih!", taxEnabled: true, bankAccounts: [] };
const items = [{ productId: "p", name: "Kopi", emoji: "☕", price: 15000, qty: 2, selectedOptions: [{ group: "Ukuran", name: "Large", priceDelta: 5000 }] }];
const sale: Sale = { id: "abcdefgh123", date: "2026-11-21T08:00:00Z", items, ...totals(items, 1000, 11), method: "Tunai", cash: 50000, voided: false, customerName: "Ibu Sari", taxEnabled: true };
it("normalizes Indonesian local and international numbers and allows an empty recipient", () => {
  for (const phone of ["081234567890", "+62 812-3456-7890", "(0812) 3456 7890", "6281234567890", "006281234567890"])
    expect(normalizePhone(phone)).toBe("6281234567890");
  expect(normalizePhone("+1 (415) 555-1234")).toBe("14155551234");
  expect(normalizePhone("   ")).toBe("");
  for (const phone of ["abc", "0812", "++6281234567890", "0812?text=bad", "00000000", "1234567890123456"])
    expect(() => normalizePhone(phone)).toThrow();
});
it("formats store, buyer, options, amounts, PPN and cash change as plain text", () => {
  const text = receiptText(sale, settings);
  for (const value of ["Warung Melati", "Bandung", "STRUK #ABCDEFGH", "Pembeli: Ibu Sari", "2× Kopi", "Ukuran: Large (+Rp5.000)", "Subtotal:", "Diskon:", "PPN 11%:", "TOTAL:", "Pembayaran: Tunai", "Dibayar:", "Kembalian:", "Terima kasih!"])
    expect(text).toContain(value);
  expect(text).toContain("32.190");
  expect(text).toContain("17.810");
  expect(text).not.toContain("undefined");
});
it("formats legacy, empty, voided, QRIS and transfer receipts without losing bank snapshots", () => {
  const legacy = receiptText({ ...sale, customerName: undefined, taxEnabled: undefined, items: [], voided: true }, settings);
  expect(legacy).toContain("Pembeli: —"); expect(legacy).toContain("Pajak:"); expect(legacy).toContain("DIBATALKAN");
  expect(receiptText({ ...sale, method: "QRIS" }, settings)).toContain("Pembayaran: QRIS");
  const text = receiptText({ ...sale, method: "Transfer", bankAccount: { id: "b", bankName: "BCA", accountNumber: "001234", accountHolder: "Sari" } }, settings);
  expect(text).toContain("Bank: BCA\nRekening: 001234\na.n. Sari");
});
it("encodes receipt text without injecting URL parameters and supports recipient selection", () => {
  const text = "Warung & Kopi\nPembeli: +Sari? #1";
  const url = new URL(whatsAppReceiptURL("081234567890", text));
  expect(url.origin + url.pathname).toBe("https://wa.me/6281234567890");
  expect(url.searchParams.get("text")).toBe(text);
  expect([...url.searchParams.keys()]).toEqual(["text"]);
  expect(whatsAppReceiptURL("", text)).toBe("https://wa.me/?text=" + encodeURIComponent(text));
});
it("wraps text and long unbroken names without dropping content or blank paragraphs", () => {
  expect(wrapReceiptText("Kopi susu\n\nABCDEFGHI", s => s.length, 5)).toEqual(["Kopi", "susu", "", "ABCDE", "FGHI"]);
  expect(wrapReceiptText("", s => s.length, 5)).toEqual([""]);
  expect(() => wrapReceiptText("a", s => s.length, 0)).toThrow();
});
