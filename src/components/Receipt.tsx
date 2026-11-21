import { Printer } from "lucide-react";
import { rupiah, type Sale, type Settings } from "../lib/logic";
import { Modal } from "./Modal";

export function Receipt({
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
