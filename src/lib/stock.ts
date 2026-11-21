import type { Product, Category } from "./logic";
import { csvDocument } from "./csv";

export type StockStatus = "Habis" | "Menipis" | "Aman";
export function stockStatus(product: Pick<Product, "stock" | "minStock">): StockStatus | null {
  if (product.stock === null) return null;
  if (product.stock === 0) return "Habis";
  return product.stock <= (product.minStock ?? 0) ? "Menipis" : "Aman";
}
export function isLowStock(product: Pick<Product, "stock" | "minStock">) {
  const status = stockStatus(product);
  return status === "Habis" || status === "Menipis";
}
export function filterStock(products: Product[], query: string, category: string, status: string) {
  const needle = query.trim().toLocaleLowerCase("id-ID");
  return products.filter(p => p.name.toLocaleLowerCase("id-ID").includes(needle) &&
    (!category || p.category === category) && (!status || (stockStatus(p) ?? "Tidak dilacak") === status));
}
export function stockCSV(products: Product[], categories: Category[], storeName: string) {
  return csvDocument([
    ["LAPORAN STOK", storeName],
    ["Produk", "Kategori", "Stok", "Minimum", "Status"],
    ...products.map(p => [p.name, categories.find(c => c.id === p.category)?.name ?? "Lainnya", p.stock ?? "Tidak dilacak", p.minStock ?? 0, stockStatus(p) ?? "Tidak dilacak"]),
  ]);
}
