import { expect, it } from "vitest";
import { browseProducts } from "./catalog";
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
