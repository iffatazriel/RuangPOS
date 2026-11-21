import { expect, it } from "vitest";
import { filterStock, isLowStock, stockCSV, stockStatus } from "./stock";
import { validateBackup, type Product } from "./logic";
import { defaults } from "./db";

const product: Product = { id: "p", name: "Kopi", category: "c", stock: 5, minStock: 5, price: 10000, emoji: "☕", active: true };
it("classifies zero, threshold boundaries, missing minimums and untracked inventory", () => {
  expect(stockStatus({ stock: 0 })).toBe("Habis");
  expect(stockStatus({ stock: 5, minStock: 5 })).toBe("Menipis");
  expect(stockStatus({ stock: 4, minStock: 5 })).toBe("Menipis");
  expect(stockStatus({ stock: 6, minStock: 5 })).toBe("Aman");
  expect(stockStatus({ stock: 1 })).toBe("Aman");
  expect(stockStatus({ stock: 1, minStock: 0 })).toBe("Aman");
  expect(stockStatus({ stock: null, minStock: 100 })).toBeNull();
  expect(isLowStock({ stock: null })).toBe(false);
  expect(isLowStock({ stock: 0 })).toBe(true);
  expect(isLowStock(product)).toBe(true);
});
it("combines name, category and status filters and handles empty results", () => {
  const products = [product, { ...product, id: "2", name: "Teh", category: "t", stock: 0 }, { ...product, id: "3", name: "Kopi bebas", stock: null }];
  expect(filterStock(products, " KOPI ", "c", "Menipis")).toEqual([product]);
  expect(filterStock(products, "", "", "Tidak dilacak")).toEqual([products[2]]);
  expect(filterStock(products, "", "t", "Habis")).toEqual([products[1]]);
  expect(filterStock(products, "unknown", "", "")).toEqual([]);
  expect(filterStock([], "", "", "")).toEqual([]);
});
it("exports BOM semicolon CSV, safely escapes names, and keeps empty table headers", () => {
  const csv = stockCSV([{ ...product, name: '=Kopi; "Susu"' }], [{ id: "c", name: "Minuman" }], "Warung");
  expect(csv.startsWith('\ufeff"LAPORAN STOK";"Warung"')).toBe(true);
  expect(csv).toContain('"\'=Kopi; ""Susu""";"Minuman";"5";"5";"Menipis"');
  expect(stockCSV([{ ...product, stock: null }], [], "Warung")).toContain('"Tidak dilacak"');
  expect(stockCSV([], [], "Warung")).toContain('"Produk";"Kategori";"Stok";"Minimum";"Status"');
});
it("round-trips optional minimums, imports legacy products and rejects invalid thresholds", () => {
  const backup = { version: 1, products: [product], categories: [], sales: [], settings: defaults };
  expect(validateBackup(backup)).toEqual(backup);
  const { minStock: _min, ...legacy } = product; void _min;
  expect(validateBackup({ ...backup, products: [legacy] }).products).toEqual([legacy]);
  for (const minStock of [-1, 0.5, NaN, Infinity, null, "5", Number.MAX_SAFE_INTEGER + 1])
    expect(() => validateBackup({ ...backup, products: [{ ...product, minStock }] })).toThrow("Produk tidak valid.");
});
