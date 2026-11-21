import { Printer } from "lucide-react";
import { rupiah, PPN_RATE, type Sale, type Settings } from "../lib/logic";
import { Modal } from "./Modal";
import { lineKey, optionText } from "../lib/options";
import { useState } from "react";
import { receiptText, whatsAppReceiptURL } from "../lib/receipt";
import { receiptPNG, shareReceiptPNG } from "../lib/receiptImage";

export function Receipt({
  sale: s,
  settings,
  close,
}: {
  sale: Sale;
  settings: Settings;
  close: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
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
        <p>Pembeli: {s.customerName ?? "—"}</p>
        {s.items.map((i) => (
          <p className="receipt-row" key={lineKey(i)}>
            <span>
              {i.qty}× {i.name}
              {!!i.selectedOptions?.length && <small className="line-options">{optionText(i)}</small>}
            </span>
            <b>{rupiah(i.price * i.qty)}</b>
          </p>
        ))}
        <hr />
        {[
          ["Subtotal", s.subtotal],
          ["Diskon", s.discount],
          [s.taxEnabled === undefined ? "Pajak" : `PPN ${PPN_RATE}%`, s.tax],
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
        {s.bankAccount && <p>Transfer: {s.bankAccount.bankName}<br />{s.bankAccount.accountNumber}<br />a.n. {s.bankAccount.accountHolder}</p>}
        <p>{settings.footer}</p>
        <small>RuangPOS · Kasir lokal untuk usaha Anda</small>
      </div>
      <button className="primary pay" onClick={() => window.print()}>
        <Printer size={17} /> Cetak struk
      </button>
      <div className="receipt-tools form-grid">
        <label>Nomor WhatsApp (opsional)<input type="tel" inputMode="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(""); }} placeholder="081234567890" autoComplete="tel" /></label>
        <small className="notice">Tanpa nomor, pilih penerima di WhatsApp. Struk hanya dibagikan saat Anda menekan Kirim WA.</small>
        <div className="actions">
          <button onClick={() => {
            setError("");
            try { window.open(whatsAppReceiptURL(phone, receiptText(s, settings)), "_blank", "noopener,noreferrer"); }
            catch (error) { setError((error as Error).message); }
          }}>Kirim WA</button>
          <button disabled={saving} onClick={async () => {
            setSaving(true); setError("");
            try {
              const blob = await receiptPNG(receiptText(s, settings));
              await shareReceiptPNG(blob, `struk-${s.id.replace(/[^a-z0-9-]/gi, "").slice(0, 12) || "ruangpos"}.png`);
            } catch (error) { setError((error as Error).message); }
            finally { setSaving(false); }
          }}>{saving ? "Menyiapkan gambar..." : "Simpan gambar"}</button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
