import { expect, it } from "vitest";
import { addCartLine, lineKey, optionLine, optionText, validOptionGroups, validSelections } from "./options";
import { stats, totals, type Product, type Sale } from "./logic";
import { aggregateReport, reportCSV } from "./reports";

const product: Product = {
  id: "coffee", name: "Kopi", emoji: "☕", category: "", price: 10000, stock: 4, active: true,
  optionGroups: [
    { name: "Ukuran", required: true, multiple: false, options: [{ name: "Regular", priceDelta: 0 }, { name: "Large", priceDelta: 5000 }] },
    { name: "Topping", required: false, multiple: true, options: [{ name: "Boba", priceDelta: 3000 }, { name: "Jelly", priceDelta: 2000 }] },
  ],
};
it("keeps plain products direct-addable and prices required single and multiple selections", () => {
  expect(optionLine({ ...product, optionGroups: undefined }).price).toBe(10000);
  const line = optionLine(product, [[1], [0, 1]]);
  expect(line.price).toBe(20000);
  expect(line.selectedOptions).toEqual([
    { group: "Ukuran", name: "Large", priceDelta: 5000 },
    { group: "Topping", name: "Boba", priceDelta: 3000 },
    { group: "Topping", name: "Jelly", priceDelta: 2000 },
  ]);
  expect(optionText(line)).toContain("Ukuran: Large (+Rp5.000)");
  expect(totals([line], 1000, 11).total).toBe(21090);
});
it("rejects missing required choices, duplicate/unknown indices and multiple single choices", () => {
  for (const choices of [[], [[]], [[0, 1]], [[-1]], [[2]], [[0], [0, 0]], [[0], [0.5]], [[0], [], [0]]])
    expect(() => optionLine(product, choices)).toThrow();
  expect(() => optionLine({ ...product, price: Number.MAX_SAFE_INTEGER }, [[1]])).toThrow("Harga varian");
  expect(() => optionLine({ ...product, price: -1 }, [[0]])).toThrow("Harga varian");
});
it("omits zero deltas, preserves nonzero formatting and handles absent options", () => {
  expect(optionText(optionLine(product, [[0]]))).toBe("Ukuran: Regular");
  expect(optionText({ selectedOptions: [
    { group: "Gula", name: "Normal", priceDelta: 0 },
    { group: "Topping", name: "Boba", priceDelta: 3000 },
    { group: "Ukuran", name: "Kecil", priceDelta: -1000 },
  ] })).toBe("Gula: Normal, Topping: Boba (+Rp3.000), Ukuran: Kecil (−Rp1.000)");
  expect(optionText({})).toBe("");
  expect(optionText({ selectedOptions: [] })).toBe("");
});
it("canonicalizes selection order and merges only identical options while sharing product stock", () => {
  const regular = optionLine(product, [[0]]);
  const large = optionLine(product, [[1], [0, 1]]);
  const reversed = optionLine(product, [[1], [1, 0]]);
  expect(lineKey(large)).toBe(lineKey(reversed));
  expect(lineKey(regular)).not.toBe(lineKey(large));
  expect(lineKey({ productId: "coffee" })).toBe(lineKey({ productId: "coffee", selectedOptions: [] }));
  const cart = addCartLine(addCartLine(addCartLine([], regular, 4), large, 4), reversed, 4);
  expect(cart.map(i => i.qty)).toEqual([1, 2]);
  expect(() => addCartLine(cart, regular, 3)).toThrow("Stok");
  expect(cart.map(i => i.qty)).toEqual([1, 2]);
  expect(addCartLine(cart, regular, null)[0].qty).toBe(2);
  expect(() => addCartLine([], regular, 0)).toThrow("Stok");
});
it("snapshots option names and prices independently of later catalog edits", () => {
  const copy = structuredClone(product);
  const line = optionLine(copy, [[1]]);
  copy.optionGroups![0].options[1] = { name: "Extra large", priceDelta: 9000 };
  expect(line.selectedOptions![0]).toEqual({ group: "Ukuran", name: "Large", priceDelta: 5000 });
  expect(line.price).toBe(15000);
});
it("groups variants by product in stats and reports while exporting option snapshots", () => {
  const items = [optionLine(product, [[0]]), optionLine(product, [[1], [0]])];
  const sale: Sale = { id: "s", date: "2026-11-21T12:00:00", items, ...totals(items, 0, 0), method: "Tunai", cash: 28000, voided: false };
  expect(stats([sale], "2026-11-21").top).toEqual([{ name: "Kopi", emoji: "☕", qty: 2 }]);
  const report = aggregateReport([sale], "harian", "2026-11-21");
  expect(report.products).toHaveLength(1);
  expect(report.products[0]).toMatchObject({ qty: 2, revenue: 28000 });
  expect(reportCSV(report, "Warung")).toContain("Ukuran: Large (+Rp5.000)");
  expect(reportCSV(report, "Warung")).toContain("Ukuran: Regular");
  expect(reportCSV(report, "Warung")).not.toContain("+Rp0");
});
it("validates group shape, unique names, signed whole-Rupiah deltas and selection snapshots", () => {
  expect(validOptionGroups([])).toBe(true);
  expect(validOptionGroups(product.optionGroups)).toBe(true);
  const group = product.optionGroups![0];
  for (const invalid of [null, {}, [{ ...group, name: " " }], [{ ...group, required: "yes" }], [{ ...group, options: [] }], [group, group], [{ ...group, options: [group.options[0], group.options[0]] }], [{ ...group, options: [{ name: "A", priceDelta: 0.5 }] }]])
    expect(validOptionGroups(invalid)).toBe(false);
  const optional = { ...group, required: false, options: [{ name: "Kecil", priceDelta: -1000 }] };
  expect(optionLine({ ...product, optionGroups: [optional] }, [[0]]).price).toBe(9000);
  expect(validSelections([])).toBe(true);
  expect(validSelections([{ group: "Gula", name: "Normal", priceDelta: 0 }])).toBe(true);
  expect(validSelections([{ group: "", name: "Normal", priceDelta: 0 }])).toBe(false);
  expect(validSelections([{ group: "Gula", name: "Normal", priceDelta: NaN }])).toBe(false);
});
