import { useState } from "react";
import { useData } from "../hooks/useData";
import { openShift, closeShift } from "../lib/db";
import { rupiah, type Sale } from "../lib/logic";
import { summarizeShift, type Shift } from "../lib/shifts";
import { Modal } from "./Modal";

export function ShiftControls({ allowOpen = true }: { allowOpen?: boolean }) {
  const { shifts, sales } = useData();
  const shift = shifts.find(s => s.status === "open");
  const [opening, setOpening] = useState("");
  const [cashier, setCashier] = useState("");
  const [closing, setClosing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!shift && !allowOpen) return null;
  return <section className="panel shift-control">
    {shift ? <div className="section-heading">
      <div><h2>Shift terbuka{shift.cashierName ? ` · ${shift.cashierName}` : ""}</h2><p className="notice">Sejak {new Date(shift.openedAt).toLocaleString("id-ID")} · Modal awal {rupiah(shift.openingCash)}</p></div>
      <button onClick={() => setClosing(shift.id)}>Tutup shift</button>
    </div> : <>
      <h2>Buka shift</h2>
      <p className="notice">Buka shift sebelum menyimpan transaksi. Hanya satu shift dapat terbuka di perangkat ini.</p>
      <form className="actions shift-opening" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError("");
        try { await openShift(Number(opening), cashier); setOpening(""); setCashier(""); }
        catch (error) { setError((error as Error).message); }
        finally { setBusy(false); }
      }}>
        <label>Modal awal (Rp)<input required type="number" min="0" step="1" inputMode="numeric" value={opening} onChange={e => setOpening(e.target.value)} /></label>
        <label>Nama kasir (opsional)<input maxLength={60} value={cashier} onChange={e => setCashier(e.target.value)} /></label>
        <button className="primary" disabled={busy}>{busy ? "Membuka..." : "Buka shift"}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </>}
    {shift && closing === shift.id && <CloseShiftDialog shift={shift} sales={sales} close={() => setClosing(null)} />}
  </section>;
}
function CloseShiftDialog({ shift, sales, close }: { shift: Shift; sales: Sale[]; close: () => void }) {
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const amount = Number(counted);
  const valid = counted !== "" && Number.isSafeInteger(amount) && amount >= 0;
  const summary = summarizeShift(shift, sales, valid ? amount : 0);
  return <Modal title="Tutup shift" close={() => { if (!busy) close(); }}>
    <form className="form-grid" onSubmit={async e => {
      e.preventDefault(); if (!valid) return; setBusy(true); setError("");
      try { await closeShift(shift.id, amount, note); close(); }
      catch (error) { setError((error as Error).message); }
      finally { setBusy(false); }
    }}>
      <p>Dibuka: {new Date(shift.openedAt).toLocaleString("id-ID")}<br />Kasir: {shift.cashierName || "—"}</p>
      <p className="receipt-row"><span>Modal awal</span><b>{rupiah(shift.openingCash)}</b></p>
      <p className="receipt-row"><span>Transaksi (tidak batal)</span><b>{summary.count}</b></p>
      {summary.payments.map(p => <p className="receipt-row" key={p.method}><span>{p.method} · {p.count} transaksi</span><b>{rupiah(p.total)}</b></p>)}
      <p className="grand-total">Kas seharusnya <b>{rupiah(summary.expectedCash)}</b></p>
      <small className="notice">Modal awal + penjualan tunai bersih (setelah kembalian). Transaksi batal tidak dihitung.</small>
      <label>Uang fisik dihitung (Rp)<input required type="number" min="0" step="1" inputMode="numeric" value={counted} onChange={e => setCounted(e.target.value)} /></label>
      {valid && <Difference value={summary.difference} />}
      <label>Catatan (opsional)<textarea maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label>
      <p className="notice">Ringkasan disimpan saat ditutup dan tidak berubah jika ada pembatalan sesudahnya.</p>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="primary" disabled={busy || !valid}>{busy ? "Menyimpan..." : "Simpan & tutup shift"}</button>
    </form>
  </Modal>;
}
export function Difference({ value }: { value: number }) {
  return <p className={`shift-difference ${value < 0 ? "short" : value > 0 ? "over" : "balanced"}`} role="status">Selisih: {value < 0 ? "Kurang" : value > 0 ? "Lebih" : "Pas"} <b>{rupiah(Math.abs(value))}</b></p>;
}
