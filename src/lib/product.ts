import type { Product } from "./logic";

export function productChanges(originalStock: Product["stock"], product: Product) {
  const { id: _id, stock, ...fields } = product;
  void _id;
  return stock === originalStock ? fields : { ...fields, stock };
}
