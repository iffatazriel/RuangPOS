import { useState } from "react";
import { useData } from "../hooks/useData";
import { rupiah } from "../lib/logic";
import { voidsAfterClose } from "../lib/shifts";
import { Modal } from "./Modal";
import { Difference } from "./ShiftControls";

export function ShiftHistory() {
  const { shifts, sales, settings } = useData();
  const [detail, setDetail] = useState<string | null>(null);
  const shift = shifts.find(s => s.id === detail);
  const summary = shift?.summary;
  const after = shift ? voidsAfterClose(shift, sales) : [];
  return <section className="panel shift-history">
    <div className="section-heading"><h2>Riwayat shift</h2><span className="pill">{shifts.length} shift</span></div>
    <div className="table-wrap"><table>
      <thead><tr><th>Dibuka</th><th>Kasir</th><th>Status</th><th>Modal awal</th><th>Transaksi</th><th>Selisih</th><th>Aksi</th></tr></thead>
      <tbody>{shifts.map(s => <tr key={s.id}>
        <td>{new Date(s.openedAt).toLocaleString("id-ID")}</td><td>{s.cashierName || "—"}</td><td>{s.status === "open" ? "Terbuka" : "Ditutup"}</td><td>{rupiah(s.openingCash)}</td><td>{s.summary?.count ?? "—"}</td><td>{s.summary ? rupiah(s.summary.difference) : "—"}</td><td><button onClick={() => setDetail(s.id)}>Detail shift</button></td>
      </tr>)}</tbody>
    </table></div>
    {!shifts.length && <p className="no-data">Belum ada shift. Buka shift di Kasir untuk mulai berjualan.</p>}
    {shift && <Modal title="Detail shift" close={() => setDetail(null)}>
      <div className="receipt">
        <h2>{settings.name}</h2><p>Laporan shift #{shift.id.slice(0, 8).toUpperCase()}</p>
        <p>Kasir: {shift.cashierName || "—"}<br />Dibuka: {new Date(shift.openedAt).toLocaleString("id-ID")}<br />Ditutup: {shift.closedAt ? new Date(shift.closedAt).toLocaleString("id-ID") : "Masih terbuka"}</p>
        <hr /><p className="receipt-row"><span>Modal awal</span><b>{rupiah(shift.openingCash)}</b></p>
        {summary ? <>
          <p className="receipt-row"><span>Transaksi</span><b>{summary.count}</b></p>
          {summary.payments.map(p => <p className="receipt-row" key={p.method}><span>{p.method} ({p.count})</span><b>{rupiah(p.total)}</b></p>)}
          <p className="receipt-row"><span>Pendapatan</span><b>{rupiah(summary.revenue)}</b></p>
          <p className="receipt-row"><span>Kas seharusnya</span><b>{rupiah(summary.expectedCash)}</b></p>
          <p className="receipt-row"><span>Uang fisik dihitung</span><b>{rupiah(summary.countedCash)}</b></p>
          <Difference value={summary.difference} />
          <p>Ringkasan saat tutup (tidak berubah).</p>
        </> : <p>Ringkasan final tersedia setelah shift ditutup.</p>}
        {after.length > 0 && <p className="notice" role="status">Ada {after.length} transaksi dibatalkan setelah shift ditutup ({after.map(s => `#${s.id.slice(0, 8)}`).join(", ")}). Snapshot di atas tetap; riwayat transaksi dan ringkasan penjualan mengikuti pembatalan.</p>}
        {shift.note && <p>Catatan: {shift.note}</p>}
      </div>
      <button className="primary pay" onClick={() => window.print()}>Cetak laporan shift</button>
    </Modal>}
  </section>;
}
