import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ShoppingCart, ArrowDownAZ, Search } from "lucide-react";
import { db, defaults, saveSale } from "../lib/db";
import {
  rupiah,
  totals,
  type Product,
  type Sale,
  type Line,
} from "../lib/logic";
import { Empty } from "../components/EmptyState";
import { Receipt } from "../components/Receipt";
import { ProductCard } from "../components/ProductCard";
import { CartPanel } from "../components/CartPanel";
import { browseProducts, type ProductSort } from "../lib/catalog";
import { useMediaQuery } from "../hooks/useMediaQuery";

export function Kasir() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.get("store")) ?? defaults;
  const [params] = useSearchParams();
  const location = useLocation();
  const [query, setQuery] = useState<string | null>(null);
  const [category, setCategory] = useState("best");
  const [sort, setSort] = useState<ProductSort>("default");
  const [cartOpen, setCartOpen] = useState(false);
  const smallScreen = useMediaQuery("(max-width: 1279px)");
  const sales = useLiveQuery(() => db.sales.toArray()) ?? [];
  const incomingQuery = params.get("q");
  useEffect(() => {
    if (incomingQuery !== null) {
      setQuery(incomingQuery);
      setCategory("");
    }
  }, [incomingQuery, location.key]);
  const [cart, setCart] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("Tunai");
  const [cash, setCash] = useState(0);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const sum = totals(cart, discount, settings.tax);
  const visible = browseProducts(
    products,
    sales,
    category,
    query ?? params.get("q") ?? "",
    sort,
  );
  const update = (p: Product) => {
    setCart((c) => {
      const old = c.find((i) => i.productId === p.id);
      if (p.stock !== null && (old?.qty ?? 0) >= p.stock) {
        setError("Stok produk tidak cukup.");
        return c;
      }
      return old
        ? c.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i))
        : [
            ...c,
            {
              productId: p.id,
              name: p.name,
              emoji: p.emoji,
              price: p.price,
              qty: 1,
            },
          ];
    });
  };
  async function pay() {
    setError("");
    if (!cart.length) return;
    if (method === "Tunai" && (!Number.isSafeInteger(cash) || cash < 0)) {
      setError("Uang diterima harus berupa Rupiah bulat.");
      return;
    }
    if (method === "Tunai" && cash < sum.total) {
      setError("Uang diterima belum cukup.");
      return;
    }
    setBusy(true);
    try {
      const s: Sale = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        items: cart,
        ...sum,
        method,
        cash: method === "Tunai" ? cash : sum.total,
        voided: false,
      };
      await saveSale(s);
      setCartOpen(false);
      setReceipt(s);
      setCart([]);
      setCash(0);
      setDiscount(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!products.length ? (
        <Empty />
      ) : (
        <div className={"cashier-layout" + (cartOpen ? " drawer-open" : "")}>
          <section className="catalog">
            <div className="catalog-heading">
              <div>
                <p className="eyebrow">MENU PILIHAN UNTUK PELANGGAN ANDA</p>
                <h1>Kategori</h1>
                <p>Temukan favorit, ciptakan momen nikmat.</p>
              </div>
              <div className="search product-search">
                <Search size={18} />
                <input
                  aria-label="Cari di kasir"
                  placeholder="Cari menu favorit..."
                  value={query ?? params.get("q") ?? ""}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <kbd>⌕</kbd>
              </div>
            </div>
            <div className="chips">
              <button
                className={category === "best" ? "selected" : ""}
                onClick={() => setCategory("best")}
              >
                <span className="category-icon">⭐</span>Terlaris
              </button>
              <button
                className={!category ? "selected" : ""}
                onClick={() => setCategory("")}
              >
                <span className="category-icon">🍽</span>Semua
              </button>
              {categories.map((c, i) => (
                <button
                  className={category === c.id ? "selected" : ""}
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                >
                  <span className="category-icon">
                    {products.find((p) => p.category === c.id)?.emoji ??
                      ["☕", "🍵", "🍛", "🍞"][i % 4]}
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="catalog-section-heading">
              <div>
                <h2>
                  {category === "best"
                    ? "Favorit pelanggan"
                    : category
                      ? categories.find((c) => c.id === category)?.name
                      : "Semua menu"}
                  <span className="catalog-count">{visible.length} menu</span>
                </h2>
                <p>
                  {category === "best"
                    ? "Pilihan paling dicintai dalam 30 hari terakhir."
                    : "Setiap sajian punya cerita. Pilih yang paling Anda suka."}
                </p>
              </div>
              <button
                className="sort-button"
                onClick={() =>
                  setSort(
                    sort === "default"
                      ? "asc"
                      : sort === "asc"
                        ? "desc"
                        : "default",
                  )
                }
              >
                <ArrowDownAZ size={16} />
                {sort === "default"
                  ? "A–Z"
                  : sort === "asc"
                    ? "A–Z ↑"
                    : "Z–A ↓"}
              </button>
            </div>
            <div className="product-grid">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} add={update} />
              ))}
            </div>
            {!visible.length && (
              <div className="no-data">
                <Search size={30} />
                <h2>Belum ada menu yang cocok</h2>
                <p>Coba kata kunci lain atau pilih kategori Semua.</p>
                <button
                  onClick={() => {
                    setQuery("");
                    setCategory("");
                  }}
                >
                  Lihat semua menu
                </button>
              </div>
            )}
          </section>
          <button
            className="cart-overlay"
            aria-label="Tutup keranjang"
            onClick={() => setCartOpen(false)}
          />
          <CartPanel
            modal={cartOpen && smallScreen}
            {...{
              cart,
              setCart,
              products,
              update,
              settings,
              sum,
              discount,
              setDiscount,
              method,
              setMethod,
              cash,
              setCash,
              error,
              busy,
              pay,
            }}
            close={() => setCartOpen(false)}
          />
        </div>
      )}
      {!!products.length && (
        <button className="floating-cart" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={20} />
          <span>
            Lihat keranjang <b>{cart.reduce((s, i) => s + i.qty, 0)}</b>
          </span>
          <strong>{rupiah(sum.total)}</strong>
        </button>
      )}
      {receipt && (
        <Receipt
          sale={receipt}
          settings={settings}
          close={() => setReceipt(null)}
        />
      )}
    </>
  );
}
