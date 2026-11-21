import { expect, it } from "vitest";
import { browseProducts, defaultCategory } from "./catalog";
import type { Product, Sale } from "./logic";
const products: Product[] = ["Zaitun", "Americano", "Matcha"].map(
  (name, i) => ({
    id: String(i),
    name,
    category: i === 2 ? "tea" : "coffee",
    price: 1000,
    stock: null,
    emoji: "",
    active: true,
  }),
);
const sale = (
  date: string,
  productId: string,
  qty: number,
  voided = false,
): Sale => ({
  id: date,
  date,
  items: [{ productId, name: "", emoji: "", price: 1000, qty }],
  subtotal: 1000,
  discount: 0,
  tax: 0,
  total: 1000,
  method: "Tunai",
  cash: 1000,
  voided,
});
it("ranks the last 30 local calendar days, excluding voided and future sales", () => {
  const now = new Date("2026-03-30T12:00:00");
  const sales = [
    sale("2026-03-01T12:00:00", "0", 2),
    sale("2026-03-30T12:00:00", "1", 3),
    sale("2026-02-28T12:00:00", "2", 50),
    sale("2026-03-31T12:00:00", "2", 50),
    sale("2026-03-20T12:00:00", "2", 50, true),
  ];
  expect(
    browseProducts(products, sales, "best", "", "default", now).map(
      (p) => p.id,
    ),
  ).toEqual(["1", "0"]);
});
it("filters, sorts and handles empty results without mutating the catalog", () => {
  expect(
    browseProducts(products, [], "", "", "asc").map((p) => p.name),
  ).toEqual(["Americano", "Matcha", "Zaitun"]);
  expect(
    browseProducts(products, [], "coffee", "AMER", "desc").map((p) => p.id),
  ).toEqual(["1"]);
  expect(browseProducts(products, [], "best", "", "default")).toEqual([]);
  expect(
    browseProducts(
      products.map((p) => ({ ...p, active: false })),
      [],
      "",
      "",
      "default",
    ),
  ).toEqual([]);
  expect(products[0].name).toBe("Zaitun");
});
it("searches all active products regardless of the selected category", () => {
  for (const category of ["best", "coffee"]) {
    expect(
      browseProducts(products, [], category, " MATCHA ", "default").map(p => p.id),
    ).toEqual(["2"]);
    expect(
      browseProducts(products.map(p => ({ ...p, active: false })), [], category, "matcha", "default"),
    ).toEqual([]);
    expect(browseProducts(products, [], category, "missing", "default")).toEqual([]);
  }
  expect(browseProducts(products, [], "best", "   ", "default")).toEqual([]);
});
it("defaults to Semua unless active products have recent non-voided sales", () => {
  const now = new Date("2026-03-30T12:00:00");
  expect(defaultCategory(products, [], now)).toBe("");
  expect(defaultCategory([], [], now)).toBe("");
  expect(defaultCategory(products, [sale("2026-03-30T12:00:00", "0", 1)], now)).toBe("best");
  expect(defaultCategory(products, [sale("2026-02-01T12:00:00", "0", 1), sale("2026-03-30T12:00:00", "1", 1, true)], now)).toBe("");
  expect(defaultCategory(products.map(p => ({ ...p, active: false })), [sale("2026-03-30T12:00:00", "0", 1)], now)).toBe("");
});
