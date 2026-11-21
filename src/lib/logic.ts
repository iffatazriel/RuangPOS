export interface Category {
  id: string;
  name: string;
}
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number | null;
  emoji: string;
  active: boolean;
  description?: string;
  photo?: Blob;
}
export interface Line {
  productId: string;
  name: string;
  emoji: string;
  price: number;
  qty: number;
  stockDeducted?: boolean;
}
export function stockAfterVoid(stock: number | null, item: Line) {
  return stock !== null && item.stockDeducted ? stock + item.qty : stock;
}
export interface Sale {
  id: string;
  date: string;
  items: Line[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  method: string;
  cash: number;
  voided: boolean;
}
export interface Settings {
  name: string;
  address: string;
  phone: string;
  footer: string;
  tax: number;
}
export interface Backup {
  version: 1;
  products: (Omit<Product, "photo"> & { photo?: string })[];
  categories: Category[];
  sales: Sale[];
  settings: Settings;
}
export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export const day = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function totals(items: Line[], discount: number, rate: number) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const off = Math.min(subtotal, Math.max(0, Math.round(discount || 0)));
  const tax = Math.round(((subtotal - off) * Math.max(0, rate)) / 100);
  return { subtotal, discount: off, tax, total: subtotal - off + tax };
}
export function stats(sales: Sale[], date: string) {
  const rows = sales.filter((s) => !s.voided && day(new Date(s.date)) === date);
  const revenue = rows.reduce((s, r) => s + r.total, 0);
  const products = new Map<
    string,
    { name: string; emoji: string; qty: number }
  >();
  for (const s of rows)
    for (const i of s.items) {
      const p = products.get(i.productId);
      products.set(i.productId, {
        name: i.name,
        emoji: i.emoji,
        qty: (p?.qty ?? 0) + i.qty,
      });
    }
  return {
    revenue,
    count: rows.length,
    average: rows.length ? Math.round(revenue / rows.length) : 0,
    quantity: rows.flatMap((s) => s.items).reduce((s, i) => s + i.qty, 0),
    top: [...products.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
  };
}
export function series(sales: Sale[], end: string, length: number) {
  return Array.from({ length }, (_, i) => {
    const d = new Date(end + "T12:00:00");
    d.setDate(d.getDate() - length + 1 + i);
    const date = day(d);
    return { date, value: stats(sales, date).revenue };
  });
}
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object";
const money = (v: unknown): v is number =>
  Number.isSafeInteger(v) && (v as number) >= 0;
export function validPhoto(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4_000_000) return false;
  const match = /^data:image\/(jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    value,
  );
  if (!match || match[2].length % 4 !== 0) return false;
  try {
    const bytes = atob(match[2]);
    return match[1] === "jpeg"
      ? bytes.startsWith("\xff\xd8\xff") && bytes.endsWith("\xff\xd9")
      : bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP";
  } catch {
    return false;
  }
}
export function validateBackup(v: unknown): Backup {
  if (
    !obj(v) ||
    v.version !== 1 ||
    !Array.isArray(v.products) ||
    !Array.isArray(v.categories) ||
    !Array.isArray(v.sales) ||
    !obj(v.settings)
  )
    throw new Error("Format cadangan tidak valid.");
  const s = v.settings;
  if (
    ![s.name, s.address, s.phone, s.footer].every(
      (x) => typeof x === "string",
    ) ||
    typeof s.tax !== "number" ||
    !Number.isFinite(s.tax) ||
    s.tax < 0 ||
    s.tax > 100
  )
    throw new Error("Pengaturan tidak valid.");
  if (
    !v.categories.every(
      (c) => obj(c) && typeof c.id === "string" && typeof c.name === "string",
    )
  )
    throw new Error("Kategori tidak valid.");
  if (
    !v.products.every(
      (p) =>
        obj(p) &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        typeof p.category === "string" &&
        typeof p.emoji === "string" &&
        typeof p.active === "boolean" &&
        (p.description === undefined || typeof p.description === "string") &&
        (p.photo === undefined || validPhoto(p.photo)) &&
        money(p.price) &&
        (p.stock === null || money(p.stock)),
    )
  )
    throw new Error("Produk tidak valid.");
  if (
    !v.sales.every(
      (t) =>
        obj(t) &&
        typeof t.id === "string" &&
        typeof t.date === "string" &&
        !isNaN(Date.parse(t.date)) &&
        typeof t.voided === "boolean" &&
        ["Tunai", "QRIS", "Transfer"].includes(String(t.method)) &&
        [t.subtotal, t.discount, t.tax, t.total, t.cash].every(money) &&
        Array.isArray(t.items) &&
        t.items.every(
          (i) =>
            obj(i) &&
            typeof i.productId === "string" &&
            typeof i.name === "string" &&
            typeof i.emoji === "string" &&
            money(i.price) &&
            money(i.qty) &&
            (i.stockDeducted === undefined ||
              typeof i.stockDeducted === "boolean") &&
            i.qty > 0,
        ),
    )
  )
    throw new Error("Transaksi tidak valid.");
  for (const list of [v.products, v.categories, v.sales])
    if (new Set(list.map((x: { id: string }) => x.id)).size !== list.length)
      throw new Error("ID duplikat dalam cadangan.");
  return v as unknown as Backup;
}
