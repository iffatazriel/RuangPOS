import { useState } from "react";
import { useData } from "../hooks/useData";
import { day } from "../lib/logic";
import { filterStock, stockCSV, stockStatus } from "../lib/stock";
import { downloadBlob } from "../lib/download";

export function StockReport() {
  const { products, categories, settings } = useData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const rows = filterStock(products, query, category, status);
  return <section className="panel stock-report" aria-labelledby="stock-report-title">
    <div className="section-heading"><h2 id="stock-report-title">Laporan stok</h2><button onClick={() => downloadBlob(new Blob([stockCSV(rows, categories, settings.name)], { type: "text/csv;charset=utf-8" }), `ruangpos-stok-${day()}.csv`)}>Export CSV</button></div>
    <div className="actions stock-filters">
      <input aria-label="Cari laporan stok" placeholder="Cari produk..." value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label="Kategori laporan stok" value={category} onChange={e => setCategory(e.target.value)}><option value="">Semua kategori</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select aria-label="Status stok" value={status} onChange={e => setStatus(e.target.value)}><option value="">Semua status</option>{["Habis", "Menipis", "Aman", "Tidak dilacak"].map(s => <option key={s}>{s}</option>)}</select>
    </div>
    <p className="notice">{rows.length} produk · CSV mengikuti filter. Produk tanpa pelacakan stok tidak memicu peringatan.</p>
    <div className="table-wrap"><table><thead><tr><th>Produk</th><th>Kategori</th><th>Stok</th><th>Minimum</th><th>Status</th></tr></thead><tbody>{rows.map(p => <tr key={p.id}><td>{p.name}</td><td>{categories.find(c => c.id === p.category)?.name ?? "Lainnya"}</td><td>{p.stock ?? "Tidak dilacak"}</td><td>{p.minStock ?? 0}</td><td><span className={`status stock-status-${stockStatus(p) ?? "untracked"}`}>{stockStatus(p) ?? "Tidak dilacak"}</span></td></tr>)}</tbody></table></div>
    {!rows.length && <p className="no-data">Tidak ada produk yang cocok dengan filter.</p>}
  </section>;
}
