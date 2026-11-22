import { ShoppingCart } from "lucide-react";
import { rupiah, type Product } from "../lib/logic";
import { ProductImage } from "./ProductImage";
import { isLowStock } from "../lib/stock";
export function ProductCard({
  product: p,
  add,
}: {
  product: Product;
  add: (product: Product) => void;
}) {
  return (
    <article className="product-card" onClick={() => { if (p.stock !== 0) add(p); }}>
      <div className="product-visual">
        <ProductImage photo={p.photo} emoji={p.emoji} name={p.name} />
        <span className="cart-notch">
          <button
            className="add-product"
            aria-label={`Tambah ${p.name} ke keranjang`}
            onClick={e => { e.stopPropagation(); add(p); }}
            disabled={p.stock === 0}
          >
            <ShoppingCart size={19} />
          </button>
        </span>
        {p.stock === 0 && <span className="sold-out">Habis</span>}
        {p.stock !== null && p.stock > 0 && <span className={"stock-badge" + (isLowStock(p) ? " low" : "")}>Sisa {p.stock}</span>}
      </div>
      <div className="product-details">
        <h3>{p.name}</h3>
        <p>
          {p.description ||
            "Dibuat segar, pilihan tepat untuk menemani hari Anda."}
        </p>
        <div className="product-price">
          <strong>{rupiah(p.price).replace(/\s/g, "")}</strong>
          <span>/porsi</span>
        </div>
      </div>
    </article>
  );
}
