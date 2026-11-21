import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "./Modal";
import { rupiah, type Sale } from "../lib/logic";
import {
  aggregateReport,
  reportCSV,
  reportFilename,
  type ReportPeriod,
  type SalesReport,
} from "../lib/reports";
import { useDialogFocus } from "../hooks/useDialogFocus";

export function ReportExport({
  date,
  sales,
  storeName,
  close,
}: {
  date: string;
  sales: Sale[];
  storeName: string;
  close: () => void;
}) {
  const [period, setPeriod] = useState<ReportPeriod>("harian");
  const [reference, setReference] = useState(date);
  const [format, setFormat] = useState("CSV");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState("");
  if (report)
    return <PrintReport report={report} storeName={storeName} close={close} />;
  return (
    <Modal title="Export ringkasan" close={close}>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const result = aggregateReport(sales, period, reference);
            if (format === "PDF") {
              setReport(result);
              return;
            }
            const url = URL.createObjectURL(
              new Blob([reportCSV(result, storeName)], {
                type: "text/csv;charset=utf-8",
              }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = reportFilename(result);
            link.click();
            URL.revokeObjectURL(url);
            close();
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      >
        <label>
          Periode
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          >
            <option value="harian">Harian</option>
            <option value="mingguan">Mingguan</option>
            <option value="bulanan">Bulanan</option>
          </select>
        </label>
        <label>
          Tanggal acuan
          <input
            required
            type="date"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
        <p className="notice">
          Mingguan: Senin–Minggu yang memuat tanggal acuan. Bulanan: satu bulan
          kalender. Transaksi batal tidak disertakan.
        </p>
        <label>
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option>CSV</option>
            <option>PDF</option>
          </select>
        </label>
        <p className="notice">
          PDF menggunakan dialog cetak browser. Pilih “Simpan sebagai PDF”.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary">
          {format === "PDF" ? "Buka laporan PDF" : "Unduh CSV"}
        </button>
      </form>
    </Modal>
  );
}
function PrintReport({
  report: r,
  storeName,
  close,
}: {
  report: SalesReport;
  storeName: string;
  close: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref, true, close);
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const t = r.totals;
  return createPortal(
    <section
      className="report-preview"
      role="dialog"
      aria-label="Laporan ringkasan PDF"
      aria-modal="true"
      ref={ref}
    >
      <div className="report-actions">
        <button onClick={() => window.print()}>Cetak / Simpan PDF</button>
        <button onClick={close}>Tutup laporan</button>
      </div>
      <article className="report-paper">
        <header>
          <p>RUANGPOS · LAPORAN USAHA</p>
          <h1>{storeName}</h1>
          <h2>Ringkasan {r.period}</h2>
          <p>
            {r.start} — {r.end}
          </p>
          <small>
            Dibuat: {new Date(r.generatedAt).toLocaleString("id-ID")}
          </small>
        </header>
        <h2>Ringkasan</h2>
        <table>
          <tbody>
            {[
              ["Pendapatan", rupiah(t.revenue)],
              ["Transaksi", t.count],
              ["Rata-rata per transaksi", rupiah(t.average)],
              ["Item terjual", t.quantity],
              ["Diskon", rupiah(t.discount)],
              ["PPN", rupiah(t.tax)],
            ].map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Pembayaran</h2>
        <table>
          <thead>
            <tr>
              <th>Metode</th>
              <th>Transaksi</th>
              <th>Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {r.payments.map((p) => (
              <tr key={p.method}>
                <td>{p.method}</td>
                <td>{p.count}</td>
                <td>{rupiah(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {r.period !== "harian" && (
          <>
            <h2>Per hari</h2>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Transaksi</th>
                  <th>Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {r.days.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{d.count}</td>
                    <td>{rupiah(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <h2>Produk terlaris</h2>
        <small>Omzet produk sebelum diskon dan PPN.</small>
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Qty</th>
              <th>Omzet</th>
            </tr>
          </thead>
          <tbody>
            {r.products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.qty}</td>
                <td>{rupiah(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Daftar transaksi</h2>
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Pembeli</th>
              <th>Metode</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {r.transactions.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.date).toLocaleString("id-ID")}</td>
                <td>{s.customerName ?? "—"}</td>
                <td>{s.method}</td>
                <td>{rupiah(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!r.transactions.length && <p>Tidak ada transaksi pada periode ini.</p>}
      </article>
    </section>,
    document.body,
  );
}
