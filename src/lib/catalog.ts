import { day, type Product, type Sale } from "./logic";
export type ProductSort = "default" | "asc" | "desc";
export function defaultCategory(products: Product[], sales: Sale[], now = new Date()) {
  return browseProducts(products, sales, "best", "", "default", now).length
    ? "best"
    : "";
}
export function browseProducts(
  products: Product[],
  sales: Sale[],
  category: string,
  query: string,
  sort: ProductSort,
  now = new Date(),
) {
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  const quantities = new Map<string, number>();
  for (const sale of sales) {
    const date = day(new Date(sale.date));
    if (sale.voided || date < day(start) || date > day(now)) continue;
    for (const item of sale.items)
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.qty,
      );
  }
  const result = products.filter(
    (p) =>
      p.active &&
      (query.trim() || !category ||
        (category === "best"
          ? quantities.has(p.id)
          : p.category === category)) &&
      p.name
        .toLocaleLowerCase("id-ID")
        .includes(query.trim().toLocaleLowerCase("id-ID")),
  );
  if (sort !== "default")
    result.sort(
      (a, b) =>
        a.name.localeCompare(b.name, "id-ID") * (sort === "asc" ? 1 : -1),
    );
  else if (category === "best")
    result.sort(
      (a, b) => (quantities.get(b.id) ?? 0) - (quantities.get(a.id) ?? 0),
    );
  return result;
}
