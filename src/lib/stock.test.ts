import { expect, it } from "vitest";
import { stockAfterVoid, type Line } from "./logic";

const item: Line = { productId: "p", name: "Kopi", emoji: "", price: 1000, qty: 2 };
it("restores only stock actually deducted by a sale", () => {
  expect(stockAfterVoid(3, { ...item, stockDeducted: true })).toBe(5);
  expect(stockAfterVoid(3, { ...item, stockDeducted: false })).toBe(3);
  expect(stockAfterVoid(3, item)).toBe(3);
  expect(stockAfterVoid(null, { ...item, stockDeducted: true })).toBeNull();
});
