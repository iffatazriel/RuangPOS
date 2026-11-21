import { describe, it, expect } from "vitest";
import { totals, stats, series, validateBackup } from "./logic";
import { defaults } from "./db";
describe("perhitungan Rupiah", () => {
  it("membulatkan pajak setelah diskon", () =>
    expect(
      totals(
        [{ productId: "a", name: "Kopi", emoji: "", price: 10005, qty: 2 }],
        1000,
        11,
      ),
    ).toEqual({ subtotal: 20010, discount: 1000, tax: 2091, total: 21101 }));
  it("membatasi diskon dan menangani keranjang kosong", () => {
    expect(totals([], 200, 10).total).toBe(0);
    expect(
      totals(
        [{ productId: "a", name: "a", emoji: "", price: 10, qty: 1 }],
        -20,
        0,
      ).total,
    ).toBe(10);
  });
  it("statistik kosong dan rentang lintas bulan", () => {
    expect(stats([], "2026-01-01").average).toBe(0);
    expect(series([], "2026-03-01", 2).map((x) => x.date)).toEqual([
      "2026-02-28",
      "2026-03-01",
    ]);
  });
  it("mengabaikan transaksi batal dan mengagregasi produk", () => {
    const s = {
      id: "x",
      date: "2026-01-01T12:00:00",
      items: [{ productId: "a", name: "Kopi", emoji: "☕", price: 10, qty: 2 }],
      ...totals(
        [{ productId: "a", name: "Kopi", emoji: "☕", price: 10, qty: 2 }],
        0,
        0,
      ),
      method: "Tunai",
      cash: 20,
      voided: false,
    };
    expect(stats([s, { ...s, voided: true }], "2026-01-01")).toMatchObject({
      revenue: 20,
      count: 1,
      quantity: 2,
      top: [{ name: "Kopi", emoji: "☕", qty: 2 }],
    });
  });
  it("memvalidasi cadangan kosong dan menolak data rusak", () => {
    const b = {
      version: 1,
      products: [],
      categories: [],
      sales: [],
      settings: defaults,
    };
    expect(validateBackup(b)).toEqual(b);
    expect(() => validateBackup({ ...b, products: [{ price: -1 }] })).toThrow();
    expect(() => validateBackup(null)).toThrow();
    expect(() =>
      validateBackup({ ...b, settings: { ...defaults, tax: 101 } }),
    ).toThrow();
  });
});
