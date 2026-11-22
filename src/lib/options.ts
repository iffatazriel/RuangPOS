import type { Line, Product } from "./logic";

export interface OptionGroup {
  name: string;
  required: boolean;
  multiple: boolean;
  options: { name: string; priceDelta: number }[];
}
export interface SelectedOption {
  group: string;
  name: string;
  priceDelta: number;
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object";
const name = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 60;
const unique = (values: string[]) => new Set(values.map(v => v.trim().toLocaleLowerCase("id-ID"))).size === values.length;
export function validOptionGroups(value: unknown): value is OptionGroup[] {
  return Array.isArray(value) && value.length <= 12 && value.every(g =>
    record(g) && name(g.name) && typeof g.required === "boolean" && typeof g.multiple === "boolean" &&
    Array.isArray(g.options) && g.options.length > 0 && g.options.length <= 30 &&
    g.options.every(o => record(o) && name(o.name) && Number.isSafeInteger(o.priceDelta)) &&
    unique(g.options.map(o => o.name)),
  ) && unique(value.map(g => g.name));
}
export function validSelections(value: unknown): value is SelectedOption[] {
  return Array.isArray(value) && value.length <= 360 && value.every(o =>
    record(o) && name(o.group) && name(o.name) && Number.isSafeInteger(o.priceDelta),
  ) && new Set(value.map(o => JSON.stringify([o.group, o.name]))).size === value.length;
}
export function lineKey(line: Pick<Line, "productId" | "selectedOptions">) {
  return JSON.stringify([line.productId, (line.selectedOptions ?? []).map(o => [o.group, o.name, o.priceDelta]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
}
export function optionText(line: Pick<Line, "selectedOptions">) {
  return (line.selectedOptions ?? []).map(o => `${o.group}: ${o.name}${o.priceDelta === 0 ? "" : ` (${o.priceDelta > 0 ? "+" : "−"}Rp${Math.abs(o.priceDelta).toLocaleString("id-ID")})`}`).join(", ");
}
export function optionLine(product: Product, choices: number[][] = []): Line {
  const groups = product.optionGroups ?? [];
  if (!validOptionGroups(groups)) throw new Error("Varian produk tidak valid.");
  if (choices.length > groups.length) throw new Error("Pilihan varian tidak valid.");
  const selectedOptions = groups.flatMap((g, index) => {
    const selected = choices[index] ?? [];
    if ((g.required && !selected.length) || (!g.multiple && selected.length > 1))
      throw new Error(`Pilih ${g.multiple ? "minimal satu" : "satu"} ${g.name}.`);
    if (new Set(selected).size !== selected.length || selected.some(i => !Number.isInteger(i) || !g.options[i]))
      throw new Error("Pilihan varian tidak valid.");
    return selected.map(i => ({ group: g.name, name: g.options[i].name, priceDelta: g.options[i].priceDelta }));
  });
  const price = product.price + selectedOptions.reduce((n, o) => n + o.priceDelta, 0);
  if (!Number.isSafeInteger(price) || price < 0) throw new Error("Harga varian harus berupa Rupiah bulat, minimal nol.");
  return { productId: product.id, name: product.name, emoji: product.emoji, price, qty: 1, selectedOptions };
}
export function addCartLine(cart: Line[], line: Line, stock: number | null) {
  const quantity = cart.filter(i => i.productId === line.productId).reduce((n, i) => n + i.qty, 0);
  if (stock !== null && quantity >= stock) throw new Error("Stok produk tidak cukup.");
  const key = lineKey(line);
  return cart.some(i => lineKey(i) === key)
    ? cart.map(i => lineKey(i) === key ? { ...i, qty: i.qty + 1 } : i)
    : [...cart, { ...line, qty: 1 }];
}
