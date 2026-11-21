import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  NavLink,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ReceiptText,
  Settings as SettingsIcon,
  Search,
  ArrowUpRight,
  Wallet,
  ShoppingCart,
  Boxes,
  X,
  Plus,
  Minus,
  Printer,
  Download,
  Upload,
  Sprout,
  CircleCheck,
  Trash2,
} from "lucide-react";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/noto-emoji/400.css";
import {
  db,
  defaults,
  seed,
  getBackup,
  replaceData,
  saveSale,
  voidSale,
} from "./lib/db";
import {
  day,
  rupiah,
  totals,
  stats,
  series,
  validateBackup,
  type Product,
  type Sale,
  type Line,
  type Settings,
} from "./lib/logic";
import "./style.css";
const nav = [
  ["/", "Ringkasan", LayoutDashboard],
  ["/kasir", "Kasir", ShoppingBag],
  ["/produk", "Produk", Package],
  ["/transaksi", "Transaksi", ReceiptText],
  ["/pengaturan", "Pengaturan", SettingsIcon],
] as const;
function App() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const settings = useLiveQuery(() => db.settings.get("store"));
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="logo">
            <ShoppingBag size={22} />
          </span>
          Ruang<span>POS</span>
        </a>
        <div className="workspace">
          <span className="store-avatar">☕</span>
          <div>
            <strong>{settings?.name ?? "Usaha Anda"}</strong>
            <small>Ruang usaha Anda</small>
          </div>
          <span className="online" />
        </div>
        <p className="nav-label">RUANG KERJA</p>
        <nav>
          {nav.map(([url, label, Icon]) => (
            <NavLink key={url} to={url} end={url === "/"}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local">
            <span className="online" /> Lokal & aman
            <small>Data tersimpan di perangkat ini</small>
          </div>
          <p>© 2026 RuangPOS</p>
        </div>
      </aside>
      <div className="shell">
        <header>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/kasir?q=" + encodeURIComponent(search));
            }}
          >
            <Search size={19} />
            <input
              aria-label="Cari produk"
              placeholder="Cari produk di sini..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <div className="header-right">
            <span className="offline">
              <span className="online" /> Siap offline
            </span>
            <span className="avatar">RK</span>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kasir" element={<Cashier />} />
            <Route path="/produk" element={<Products />} />
            <Route path="/transaksi" element={<History />} />
            <Route path="/pengaturan" element={<Preferences />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
function Title({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
function Empty() {
  const navigate = useNavigate();
  return (
    <div className="empty panel">
      <span className="empty-icon">🌱</span>
      <h2>Usaha besar dimulai dari sini.</h2>
      <p>
        Tambahkan produk pertama Anda, atau jelajahi RuangPOS dengan data
        contoh.
      </p>
      <div className="actions">
        <button className="primary" onClick={() => navigate("/produk")}>
          Tambah produk
        </button>
        <button
          onClick={() => {
            if (confirm("Isi data contoh? Data saat ini akan diganti."))
              void seed();
          }}
        >
          Isi data contoh
        </button>
      </div>
    </div>
  );
}
function Dashboard() {
  const [date, setDate] = useState(day());
  const [period, setPeriod] = useState(7);
  const sales = useLiveQuery(() => db.sales.toArray()) ?? [];
  const products = useLiveQuery(() => db.products.count());
  const s = stats(sales, date);
  const chart = series(sales, date, period);
  const max = Math.max(...chart.map((c) => c.value), 100000);
  const cards = [
    ["Pendapatan", rupiah(s.revenue), Wallet],
    ["Transaksi", String(s.count), ReceiptText],
    ["Rata-rata per transaksi", rupiah(s.average), ShoppingCart],
    ["Item terjual", String(s.quantity), Boxes],
  ] as const;
  return (
    <>
      <Title
        eyebrow="SELAMAT DATANG DI RUANG USAHA ANDA"
        title="Ringkasan usaha"
      >
        <input
          aria-label="Tanggal ringkasan"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value || day())}
        />
      </Title>
      <div className="intro-line">
        <span>Setiap transaksi, satu langkah lebih maju.</span>
        <span className="subtle">Semua dalam satu ruang.</span>
      </div>
      <div className="stats">
        {cards.map(([label, value, Icon], i) => (
          <section className={"stat " + (!i ? "featured" : "")} key={label}>
            <div className="stat-top">
              <span className="icon-badge">
                <Icon size={21} />
              </span>
              <ArrowUpRight size={18} />
            </div>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>
              {i === 0
                ? "Penjualan bersih hari ini"
                : i === 1
                  ? "Pesanan terselesaikan"
                  : i === 2
                    ? "Dari seluruh transaksi"
                    : "Produk berhasil terjual"}
            </small>
          </section>
        ))}
      </div>
      {products === 0 ? (
        <Empty />
      ) : (
        <div className="dashboard-grid">
          <section className="panel top-products">
            <div className="section-heading">
              <div>
                <h2>Produk terlaris</h2>
                <p>Favorit pelanggan hari ini</p>
              </div>
              <span className="pill">Top 5</span>
            </div>
            {s.top.length ? (
              s.top.map((p, i) => (
                <div className="top-product" key={p.name}>
                  <span className="rank">0{i + 1}</span>
                  <span className="product-emoji">{p.emoji}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <small>{p.qty} item terjual</small>
                  </div>
                  <ArrowUpRight size={16} />
                </div>
              ))
            ) : (
              <p className="no-data">Belum ada penjualan pada tanggal ini.</p>
            )}
            <div className="card-footer">
              Dibuat dengan semangat usaha kecil <span>✦</span>
            </div>
          </section>
          <section className="panel chart-panel">
            <div className="section-heading">
              <div>
                <h2>Grafik penjualan</h2>
                <p>Perjalanan pendapatan usaha Anda</p>
              </div>
              <select
                aria-label="Rentang grafik"
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
              >
                <option value={7}>Minggu</option>
                <option value={30}>Bulan</option>
              </select>
            </div>
            <div className="chart-legend">
              <span />
              Pendapatan{" "}
              <strong>{rupiah(chart.reduce((s, c) => s + c.value, 0))}</strong>
            </div>
            <div className="chart">
              <div className="y-axis">
                {[1, 0.75, 0.5, 0.25, 0].map((n) => (
                  <span key={n}>{shortMoney(max * n)}</span>
                ))}
              </div>
              <div className="plot">
                <div className="grid-lines">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <i key={n} />
                  ))}
                </div>
                <div className="bars">
                  {chart.map((c, i) => (
                    <div className="bar-column" key={c.date}>
                      <div
                        title={`${c.date}: ${rupiah(c.value)}`}
                        className="bar"
                        style={{ height: `${(c.value / max) * 100}%` }}
                      />
                      <span>
                        {period === 7
                          ? new Date(c.date + "T12:00").toLocaleDateString(
                              "id-ID",
                              { weekday: "short" },
                            )
                          : i % 5 === 0
                            ? c.date.slice(8)
                            : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="chart-note">
              <span className="online" /> Tidak termasuk transaksi yang
              dibatalkan
            </div>
          </section>
        </div>
      )}
      <div className="bottom-note">
        <Sprout size={16} /> Usaha Anda, data Anda. Tersimpan aman di perangkat
        ini.
      </div>
    </>
  );
}
function shortMoney(n: number) {
  return n >= 1000000
    ? `${+(n / 1000000).toFixed(1)}jt`
    : n >= 1000
      ? `${Math.round(n / 1000)}rb`
      : String(n);
}
function Cashier() {
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
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <div className="section-heading">
          <h2>{title}</h2>
          <button aria-label="Tutup" onClick={close}>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Receipt({
  sale: s,
  settings,
  close,
}: {
  sale: Sale;
  settings: Settings;
  close: () => void;
}) {
  return (
    <Modal title="Detail transaksi" close={close}>
      <div className="receipt">
        <h2>{settings.name}</h2>
        <p>
          {settings.address}
          <br />
          {settings.phone}
        </p>
        <p>
          {new Date(s.date).toLocaleString("id-ID")}
          <br />#{s.id.slice(0, 8).toUpperCase()} {s.voided && "— DIBATALKAN"}
        </p>
        <hr />
        {s.items.map((i) => (
          <p className="receipt-row" key={i.productId}>
            <span>
              {i.qty}× {i.name}
            </span>
            <b>{rupiah(i.price * i.qty)}</b>
          </p>
        ))}
        <hr />
        {[
          ["Subtotal", s.subtotal],
          ["Diskon", s.discount],
          ["Pajak", s.tax],
          ["TOTAL", s.total],
          ["Dibayar · " + s.method, s.cash],
          ["Kembalian", Math.max(0, s.cash - s.total)],
        ].map(([label, value]) => (
          <p className="receipt-row" key={label}>
            <span>{label}</span>
            <b>{rupiah(Number(value))}</b>
          </p>
        ))}
        <hr />
        <p>{settings.footer}</p>
        <small>RuangPOS · Kasir lokal untuk usaha Anda</small>
      </div>
      <button className="primary pay" onClick={() => window.print()}>
        <Printer size={17} /> Cetak struk
      </button>
    </Modal>
  );
}
function Products() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const [edit, setEdit] = useState<Product | null>(null);
  const [cat, setCat] = useState("");
  const [manage, setManage] = useState(false);
  const [query, setQuery] = useState("");
  return (
    <>
      <Title eyebrow="KELOLA YANG ANDA TAWARKAN" title="Produk">
        <div className="actions">
          <button onClick={() => setManage(true)}>Kelola kategori</button>
          <button
            className="primary"
            onClick={() =>
              setEdit({
                id: crypto.randomUUID(),
                name: "",
                category: categories[0]?.id ?? "",
                price: 0,
                stock: null,
                emoji: "☕",
                active: true,
              })
            }
          >
            <Plus size={17} /> Tambah produk
          </button>
        </div>
      </Title>
      <div className="panel">
        <div className="section-heading">
          <h2>
            Daftar produk <span className="subtle">({products.length})</span>
          </h2>
          <input
            aria-label="Cari daftar produk"
            placeholder="Cari produk..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter((p) =>
                  p.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="table-emoji">{p.emoji}</span>
                      <strong>{p.name}</strong>
                    </td>
                    <td>
                      {categories.find((c) => c.id === p.category)?.name ??
                        "Lainnya"}
                    </td>
                    <td>{rupiah(p.price)}</td>
                    <td>{p.stock ?? "∞"}</td>
                    <td>
                      <span className={"status " + (!p.active ? "muted" : "")}>
                        {p.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setEdit(p)}>Edit</button>{" "}
                      <button
                        aria-label={"Hapus " + p.name}
                        onClick={() => {
                          if (
                            confirm(
                              `Hapus ${p.name}? Riwayat transaksi tetap disimpan.`,
                            )
                          )
                            void db.products.delete(p.id);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!products.length && (
            <p className="no-data">
              Belum ada produk. Tambahkan produk pertama Anda.
            </p>
          )}
        </div>
      </div>
      {edit && (
        <Modal
          title={
            products.some((p) => p.id === edit.id)
              ? "Edit produk"
              : "Tambah produk"
          }
          close={() => setEdit(null)}
        >
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              await db.products.put(edit);
              setEdit(null);
            }}
          >
            <label>
              Nama produk
              <input
                required
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </label>
            <label>
              Kategori
              <select
                value={edit.category}
                onChange={(e) => setEdit({ ...edit, category: e.target.value })}
              >
                <option value="">Lainnya</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Harga (Rp)
              <input
                required
                type="number"
                min="0"
                step="1"
                value={edit.price}
                onChange={(e) =>
                  setEdit({ ...edit, price: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Stok (kosong = tidak dibatasi)
              <input
                type="number"
                min="0"
                step="1"
                value={edit.stock ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    stock:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Emoji
              <input
                required
                maxLength={12}
                value={edit.emoji}
                onChange={(e) => setEdit({ ...edit, emoji: e.target.value })}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={edit.active}
                onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
              />{" "}
              Produk aktif
            </label>
            <button className="primary">Simpan produk</button>
          </form>
        </Modal>
      )}
      {manage && (
        <Modal title="Kelola kategori" close={() => setManage(false)}>
          <form
            className="actions"
            onSubmit={async (e) => {
              e.preventDefault();
              if (cat.trim()) {
                await db.categories.add({
                  id: crypto.randomUUID(),
                  name: cat.trim(),
                });
                setCat("");
              }
            }}
          >
            <input
              required
              placeholder="Nama kategori baru"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            />
            <button className="primary">Tambah</button>
          </form>
          {categories.map((c) => (
            <div className="category-row" key={c.id}>
              <span>{c.name}</span>
              <div>
                <button
                  onClick={() => {
                    const name = prompt("Nama kategori", c.name);
                    if (name?.trim())
                      void db.categories.update(c.id, { name: name.trim() });
                  }}
                >
                  Ubah
                </button>{" "}
                <button
                  onClick={() => {
                    if (products.some((p) => p.category === c.id))
                      alert("Pindahkan produk ke kategori lain dahulu.");
                    else if (confirm("Hapus kategori ini?"))
                      void db.categories.delete(c.id);
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
function History() {
  const sales =
    useLiveQuery(() => db.sales.orderBy("date").reverse().toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.get("store")) ?? defaults;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(day());
  const [detail, setDetail] = useState<Sale | null>(null);
  const filtered = sales.filter(
    (s) =>
      (!from || day(new Date(s.date)) >= from) &&
      (!to || day(new Date(s.date)) <= to),
  );
  return (
    <>
      <Title eyebrow="CATATAN SETIAP LANGKAH USAHA" title="Riwayat transaksi">
        <span className="pill">{filtered.length} transaksi</span>
      </Title>
      <div className="panel">
        <div className="section-heading">
          <h2>Semua transaksi</h2>
          <div className="actions">
            <input
              aria-label="Dari tanggal"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span>—</span>
            <input
              aria-label="Sampai tanggal"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID / Waktu</th>
                <th>Pesanan</th>
                <th>Pembayaran</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>#{s.id.slice(0, 8).toUpperCase()}</strong>
                    <small>{new Date(s.date).toLocaleString("id-ID")}</small>
                  </td>
                  <td>
                    {s.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </td>
                  <td>{s.method}</td>
                  <td>{rupiah(s.total)}</td>
                  <td>
                    <span className={"status " + (s.voided ? "muted" : "")}>
                      {s.voided ? "Dibatalkan" : "Selesai"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => setDetail(s)}>Detail</button>
                      {!s.voided && (
                        <button
                          className="danger-text"
                          onClick={() => {
                            if (
                              confirm(
                                "Batalkan transaksi? Stok akan dikembalikan.",
                              )
                            )
                              void voidSale(s.id);
                          }}
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="no-data">Belum ada transaksi pada rentang ini.</p>
          )}
        </div>
      </div>
      {detail && (
        <Receipt
          sale={detail}
          settings={settings}
          close={() => setDetail(null)}
        />
      )}
    </>
  );
}
function Preferences() {
  const settings = useLiveQuery(() => db.settings.get("store"));
  const [form, setForm] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const s = form ?? settings ?? defaults;
  const change = (key: keyof Settings, value: string | number) =>
    setForm({ ...s, [key]: value });
  async function exportData() {
    const b = await getBackup();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(b, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ruangpos-${day()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function importData(file: File) {
    try {
      const b = validateBackup(JSON.parse(await file.text()));
      if (confirm("Ganti SEMUA data di perangkat ini dengan cadangan?")) {
        await replaceData(b);
        setForm(b.settings);
        setMessage("Cadangan berhasil dipulihkan.");
      }
    } catch (e) {
      setMessage("Gagal impor: " + (e as Error).message);
    }
  }
  return (
    <>
      <Title eyebrow="SESUAIKAN RUANG ANDA" title="Pengaturan" />
      <div className="settings-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Profil usaha</h2>
              <p>Informasi ini akan tampil di struk pelanggan.</p>
            </div>
            <span className="icon-badge">
              <ShoppingBag size={20} />
            </span>
          </div>
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              await db.settings.put({ ...s, id: "store" });
              setMessage("Pengaturan berhasil disimpan.");
            }}
          >
            {(
              [
                ["name", "Nama usaha"],
                ["address", "Alamat"],
                ["phone", "Nomor telepon"],
                ["footer", "Pesan di struk"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required={key === "name"}
                  value={s[key]}
                  onChange={(e) => change(key, e.target.value)}
                />
              </label>
            ))}
            <label>
              Pajak (%)
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                value={s.tax}
                onChange={(e) => change("tax", Number(e.target.value))}
              />
            </label>
            <button className="primary">Simpan pengaturan</button>
          </form>
        </section>
        <div className="settings-side">
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Data milik Anda</h2>
                <p>Tanpa server. Tanpa akun. Sepenuhnya lokal.</p>
              </div>
              <Download size={21} />
            </div>
            <p className="notice">
              Data disimpan di browser perangkat ini. Menghapus data browser
              dapat menghilangkan data usaha. Lakukan backup secara berkala.
            </p>
            <div className="backup-actions">
              <button onClick={() => void exportData()}>
                <Download size={17} /> Ekspor cadangan JSON
              </button>
              <label className="file-button">
                <Upload size={17} /> Impor cadangan JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importData(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>
          <section className="panel">
            <h2>Mulai menjelajah</h2>
            <p className="notice">
              Coba produk dan transaksi contoh selama 30 hari. Data saat ini
              akan diganti.
            </p>
            <button
              onClick={async () => {
                if (confirm("Ganti data saat ini dengan data contoh?")) {
                  await seed();
                  setForm(null);
                  setMessage("Data contoh siap digunakan.");
                }
              }}
            >
              <Sprout size={17} /> Isi data contoh
            </button>
          </section>
          <section className="panel danger-panel">
            <h2>Zona hati-hati</h2>
            <p className="notice">
              Hapus seluruh produk, transaksi, dan pengaturan. Tidak dapat
              dibatalkan.
            </p>
            <button
              className="danger-text"
              onClick={async () => {
                if (
                  confirm(
                    "Hapus SEMUA data? Pastikan Anda sudah membuat backup.",
                  ) &&
                  confirm("Anda yakin? Semua data akan hilang permanen.")
                ) {
                  await replaceData({
                    version: 1,
                    products: [],
                    categories: [],
                    sales: [],
                    settings: defaults,
                  });
                  setForm(null);
                  setMessage("Semua data telah dihapus.");
                }
              }}
            >
              <Trash2 size={16} /> Hapus semua data
            </button>
          </section>
        </div>
      </div>
      {message && (
        <div role="status" className="toast" onClick={() => setMessage("")}>
          {message} <X size={16} />
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
