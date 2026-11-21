import { useState } from "react";
import { useSearchParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  CircleCheck,
  Trash2,
} from "lucide-react";
import { db, defaults, saveSale } from "../lib/db";
import {
  rupiah,
  totals,
  type Product,
  type Sale,
  type Line,
} from "../lib/logic";
import { Title } from "../components/Title";
import { Empty } from "../components/EmptyState";
import { Receipt } from "../components/Receipt";
import { shortMoney } from "../lib/format";

export function Kasir() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.get("store")) ?? defaults;
  const [params] = useSearchParams();
  const [query, setQuery] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("Tunai");
  const [cash, setCash] = useState(0);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const sum = totals(cart, discount, settings.tax);
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
      <Title eyebrow="LAYANI DENGAN SEPENUH HATI" title="Kasir">
        <span className="pill">
          {products.filter((p) => p.active).length} produk tersedia
        </span>
      </Title>
      {!products.length ? (
        <Empty />
      ) : (
        <div className="cashier-layout">
          <section>
            <div className="search product-search">
              <Search size={18} />
              <input
                aria-label="Cari di kasir"
                placeholder="Cari menu favorit..."
                value={query ?? params.get("q") ?? ""}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="chips">
              <button
                className={!category ? "selected" : ""}
                onClick={() => setCategory("")}
              >
                Semua produk
              </button>
              {categories.map((c) => (
                <button
                  className={category === c.id ? "selected" : ""}
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="product-grid">
              {products
                .filter(
                  (p) =>
                    p.active &&
                    (!category || p.category === category) &&
                    p.name
                      .toLowerCase()
                      .includes((query ?? params.get("q") ?? "").toLowerCase()),
                )
                .map((p) => (
                  <button
                    className="product-card"
                    key={p.id}
                    onClick={() => update(p)}
                    disabled={p.stock === 0}
                  >
                    <span className="product-art">{p.emoji}</span>
                    <small>
                      {categories.find((c) => c.id === p.category)?.name ??
                        "Lainnya"}
                    </small>
                    <strong>{p.name}</strong>
                    <div>
                      <b>{rupiah(p.price)}</b>
                      <span className="add-circle">
                        <Plus size={16} />
                      </span>
                    </div>
                    <small>
                      {p.stock === null
                        ? "Stok tidak dibatasi"
                        : `${p.stock} tersedia`}
                    </small>
                  </button>
                ))}
            </div>
          </section>
          <section className="panel cart">
            <div className="section-heading">
              <h2>Pesanan baru</h2>
              <span className="pill">
                {cart.reduce((s, i) => s + i.qty, 0)} item
              </span>
            </div>
            <div className="cart-items">
              {cart.length ? (
                cart.map((i) => (
                  <div className="cart-item" key={i.productId}>
                    <span className="product-emoji">{i.emoji}</span>
                    <div>
                      <strong>{i.name}</strong>
                      <small>{rupiah(i.price)}</small>
                      <div className="quantity">
                        <button
                          aria-label={"Kurangi " + i.name}
                          onClick={() =>
                            setCart((c) =>
                              c.flatMap((x) =>
                                x.productId === i.productId
                                  ? x.qty > 1
                                    ? [{ ...x, qty: x.qty - 1 }]
                                    : []
                                  : [x],
                              ),
                            )
                          }
                        >
                          <Minus size={13} />
                        </button>
                        {i.qty}
                        <button
                          aria-label={"Tambah " + i.name}
                          onClick={() => {
                            const p = products.find(
                              (p) => p.id === i.productId,
                            );
                            if (p) update(p);
                          }}
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          aria-label={"Hapus " + i.name}
                          onClick={() =>
                            setCart((c) =>
                              c.filter((x) => x.productId !== i.productId),
                            )
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <b>{rupiah(i.price * i.qty)}</b>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <ShoppingBag size={35} />
                  <p>Keranjang masih kosong</p>
                  <small>Pilih produk untuk memulai pesanan.</small>
                </div>
              )}
            </div>
            <div className="totals">
              <p>
                <span>Subtotal</span>
                <b>{rupiah(sum.subtotal)}</b>
              </p>
              <label>
                Diskon (Rp)
                <input
                  aria-label="Diskon"
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </label>
              <p>
                <span>Pajak ({settings.tax}%)</span>
                <b>{rupiah(sum.tax)}</b>
              </p>
              <p className="grand-total">
                <span>Total pembayaran</span>
                <b>{rupiah(sum.total)}</b>
              </p>
            </div>
            <div className="payment-method">
              {["Tunai", "QRIS", "Transfer"].map((m) => (
                <button
                  className={method === m ? "selected" : ""}
                  key={m}
                  onClick={() => setMethod(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            {method === "Tunai" ? (
              <>
                <label>
                  Uang diterima (Rp)
                  <input
                    type="number"
                    min="0"
                    value={cash || ""}
                    placeholder="0"
                    onChange={(e) => setCash(Number(e.target.value))}
                  />
                </label>
                <div className="quick-cash">
                  {[sum.total, 50000, 100000].map((n, i) => (
                    <button key={i} onClick={() => setCash(n)}>
                      {i === 0 ? "Uang pas" : shortMoney(n)}
                    </button>
                  ))}
                </div>
                <p className="change">
                  Kembalian <b>{rupiah(Math.max(0, cash - sum.total))}</b>
                </p>
              </>
            ) : (
              <p className="notice">
                Pastikan pembayaran {method} sudah diterima sebelum menyimpan.
              </p>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button
              className="primary pay"
              disabled={!cart.length || busy}
              onClick={() => void pay()}
            >
              <CircleCheck size={18} />
              {busy ? "Menyimpan..." : "Simpan transaksi"}
            </button>
          </section>
        </div>
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
