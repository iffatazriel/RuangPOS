import { expect, it } from "vitest";
import { summarizeShift, validShift, voidsAfterClose, wholeRupiah, type Shift } from "./shifts";
import { totals, validateBackup, type Sale } from "./logic";
import { defaults } from "./db";

const shift: Shift = { id: "shift", openedAt: "2026-11-21T07:00:00Z", openingCash: 10000, cashierName: "Sari", status: "open" };
const items = [{ productId: "coffee", name: "Kopi", emoji: "☕", price: 20000, qty: 1 }];
const sale: Sale = { id: "cash", date: "2026-11-21T08:00:00Z", shiftId: shift.id, items, ...totals(items, 0, 0), method: "Tunai", cash: 50000, voided: false };
const closed = (sales: Sale[], counted: number): Shift => ({ ...shift, status: "closed", closedAt: "2026-11-21T15:00:00Z", summary: summarizeShift(shift, sales, counted), note: "Selesai" });
const backup = { version: 1, products: [], categories: [], sales: [] as Sale[], settings: defaults };
it("uses net cash totals, not tendered cash, and excludes voided or unrelated sales", () => {
  const sales = [sale, { ...sale, id: "qr", method: "QRIS" }, { ...sale, id: "bank", method: "Transfer" }, { ...sale, id: "void", voided: true }, { ...sale, id: "other", shiftId: "other" }, { ...sale, id: "legacy", shiftId: undefined }];
  expect(summarizeShift(shift, sales, 29000)).toEqual({ count: 3, revenue: 60000, payments: [{ method: "Tunai", count: 1, total: 20000 }, { method: "QRIS", count: 1, total: 20000 }, { method: "Transfer", count: 1, total: 20000 }], expectedCash: 30000, countedCash: 29000, difference: -1000, saleIds: ["cash", "qr", "bank"] });
  expect(summarizeShift(shift, sales, 31000).difference).toBe(1000);
  expect(summarizeShift(shift, sales, 30000).difference).toBe(0);
});
it("handles empty shifts and rejects fractional, negative, infinite or unsafe money", () => {
  expect(summarizeShift(shift, [], 10000)).toMatchObject({ count: 0, revenue: 0, expectedCash: 10000, difference: 0, saleIds: [] });
  for (const invalid of [0.5, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => wholeRupiah(invalid)).toThrow("Rupiah bulat");
    expect(() => summarizeShift(shift, [], invalid)).toThrow();
  }
  expect(() => summarizeShift({ ...shift, openingCash: Number.MAX_SAFE_INTEGER }, [sale], 0)).toThrow();
});
it("keeps close snapshots immutable and identifies only voids made after closing", () => {
  const priorVoid = { ...sale, id: "prior", voided: true };
  const snapshot = closed([sale, priorVoid], 30000);
  const saved = structuredClone(snapshot);
  const afterVoid = { ...sale, voided: true };
  expect(voidsAfterClose(snapshot, [afterVoid, priorVoid])).toEqual([afterVoid]);
  expect(snapshot).toEqual(saved);
  expect(summarizeShift(shift, [afterVoid], 30000).count).toBe(0);
  expect(snapshot.summary!.count).toBe(1);
  expect(voidsAfterClose(shift, [afterVoid])).toEqual([]);
});
it("validates open and closed shifts and rejects corrupt summary math", () => {
  expect(validShift(shift)).toBe(true);
  expect(validShift(closed([sale], 30000))).toBe(true);
  const snapshot = closed([sale], 30000);
  for (const value of [null, { ...shift, openingCash: 0.5 }, { ...shift, status: "other" }, { ...shift, closedAt: snapshot.closedAt }, { ...snapshot, closedAt: "bad" }, { ...snapshot, closedAt: "2026-11-20T00:00:00Z" }, { ...snapshot, summary: { ...snapshot.summary, difference: 1 } }, { ...snapshot, summary: { ...snapshot.summary, saleIds: [] } }])
    expect(validShift(value)).toBe(false);
});
it("imports legacy backups unchanged and round-trips shifts with post-close voids", () => {
  expect(validateBackup(backup)).toEqual(backup);
  const snapshot = closed([sale], 30000);
  const modern = { ...backup, shifts: [snapshot], sales: [{ ...sale, voided: true }] };
  expect(validateBackup(modern)).toEqual(modern);
  const options = [{ name: "Ukuran", required: true, multiple: false, options: [{ name: "Large", priceDelta: 5000 }] }];
  const variants = { ...modern, products: [{ id: "coffee", name: "Kopi", price: 15000, stock: 10, emoji: "☕", category: "", active: true, optionGroups: options }], sales: [{ ...sale, items: [{ ...items[0], selectedOptions: [{ group: "Ukuran", name: "Large", priceDelta: 5000 }] }] }] };
  expect(validateBackup(variants)).toEqual(variants);
  expect(validateBackup({ ...backup, shifts: [shift] }).shifts).toEqual([shift]);
});
it("rejects multiple open shifts, dangling links, duplicate IDs and invalid options in backups", () => {
  for (const invalid of [
    { ...backup, shifts: null },
    { ...backup, shifts: [shift, { ...shift, id: "two" }] },
    { ...backup, shifts: [shift, shift] },
    { ...backup, sales: [sale] },
    { ...backup, shifts: [closed([sale], 30000)] },
    { ...backup, sales: [{ ...sale, shiftId: undefined, items: [{ ...items[0], selectedOptions: [{ group: "Gula", name: "Normal", priceDelta: 1.5 }] }] }] },
    { ...backup, products: [{ id: "coffee", name: "Kopi", category: "", price: 10000, stock: null, emoji: "☕", active: true, optionGroups: [{ name: "Ukuran", required: true, multiple: false, options: [] }] }] },
  ]) expect(() => validateBackup(invalid)).toThrow();
});
