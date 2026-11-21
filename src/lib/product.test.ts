import { expect, it } from "vitest";
import { productChanges } from "./product";
import type { Product } from "./logic";

const product: Product = { id: "p", name: "Kopi", category: "", price: 1000, stock: 5, emoji: "", active: true };
it("omits unchanged stock from product updates", () => {
  expect(productChanges(5, product)).not.toHaveProperty("stock");
  expect(productChanges(5, product)).not.toHaveProperty("id");
  expect(productChanges(null, { ...product, stock: null })).not.toHaveProperty("stock");
});
it("includes explicit stock changes and tracking changes", () => {
  expect(productChanges(5, { ...product, stock: 0 })).toHaveProperty("stock", 0);
  expect(productChanges(5, { ...product, stock: null })).toHaveProperty("stock", null);
  expect(productChanges(null, product)).toHaveProperty("stock", 5);
});
