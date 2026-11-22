import { Link } from "react-router";
import { useData } from "../hooks/useData";
import { isLowStock, stockStatus } from "../lib/stock";

export function LowStockWarning() {
  const { products } = useData();
  const low = products.filter(isLowStock);
  if (!low.length) return null;
  return <section className="panel stock-warning" aria-labelledby="low-stock-title">
    <div className="section-heading"><h2 id="low-stock-title">Stok perlu perhatian <span className="pill">{low.length}</span></h2><Link to="/produk">Kelola stok</Link></div>
    <ul>{low.map(p => <li key={p.id}><strong>{p.name}</strong><span>{stockStatus(p)} · Sisa {p.stock} · Minimum {p.minStock ?? 0}</span></li>)}</ul>
  </section>;
}
