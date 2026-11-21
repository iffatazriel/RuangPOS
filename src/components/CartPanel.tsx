import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";
import { Link } from "react-router";
import { ProductImage } from "./ProductImage";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { ShoppingBag, Plus, Minus, CircleCheck, Trash2, X } from "lucide-react";
import {
  rupiah,
  PPN_RATE,
  type Line,
  type Settings,
  type totals,
} from "../lib/logic";
import { shortMoney } from "../lib/format";
import { lineKey, optionText } from "../lib/options";
type Props = {
  cart: Line[];
  setCart: Dispatch<SetStateAction<Line[]>>;
  increment: (line: Line) => void;
  shiftOpen: boolean;
  settings: Settings;
  sum: ReturnType<typeof totals>;
  discount: number;
  setDiscount: (value: number) => void;
  method: string;
  setMethod: (value: string) => void;
  cash: number;
  setCash: (value: number) => void;
  customerName: string;
  setCustomerName: (value: string) => void;
  accountId: string;
  setSelectedAccount: (value: string) => void;
  error: string;
  busy: boolean;
  pay: () => Promise<void>;
  close: () => void;
  modal: boolean;
};
export function CartPanel({
  cart,
  setCart,
  increment,
  shiftOpen,
  settings,
  sum,
  discount,
  setDiscount,
  method,
  setMethod,
  cash,
  setCash,
  customerName,
  setCustomerName,
  accountId,
  setSelectedAccount,
  error,
  busy,
  pay,
  close,
  modal,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref, modal, close);
  return (
    <section
      ref={ref}
      className="panel cart"
      aria-label="Keranjang pesanan"
      role={modal ? "dialog" : undefined}
      aria-modal={modal || undefined}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">RUANG PESANAN</p>
          <h2>Pesanan baru</h2>
        </div>
        <button
          className="icon-button close-cart"
          aria-label="Tutup keranjang"
          onClick={close}
        >
          <X size={19} />
        </button>
        <span className="pill">{cart.reduce((s, i) => s + i.qty, 0)} item</span>
      </div>
      <label>Nama pembeli
        <input required maxLength={60} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nama pembeli" autoComplete="name" />
      </label>
      <div className="cart-items">
        {cart.length ? (
          cart.map((i) => (
            <div className="cart-item" key={lineKey(i)}>
              <span className="product-emoji">{i.emoji}</span>
              <div>
                <strong>{i.name}</strong>
                {!!i.selectedOptions?.length && <small>{optionText(i)}</small>}
                <small>{rupiah(i.price)}</small>
                <div className="quantity">
                  <button
                    aria-label={"Kurangi " + i.name}
                    onClick={() =>
                      setCart((c) =>
                        c.flatMap((x) =>
                          lineKey(x) === lineKey(i)
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
                    onClick={() => increment(i)}
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    aria-label={"Hapus " + i.name}
                    onClick={() =>
                      setCart((c) =>
                        c.filter((x) => lineKey(x) !== lineKey(i)),
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
          <span>PPN {PPN_RATE}%{!settings.taxEnabled && " (nonaktif)"}</span>
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
              step="1"
              inputMode="numeric"
              onChange={(e) =>
                setCash(Math.max(0, Math.trunc(Number(e.target.value))))
              }
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
      ) : <div className="checkout-payment">
        {method === "QRIS" && (settings.qris ? <>
          <ProductImage photo={settings.qris} emoji="" name="QRIS untuk dipindai pelanggan" className="qris-image" />
          <p className="grand-total">Total QRIS <b>{rupiah(sum.total)}</b></p>
        </> : <p className="notice">QRIS belum tersedia. <Link to="/pengaturan">Unggah QRIS di Pengaturan</Link>.</p>)}
        {method === "Transfer" && (settings.bankAccounts.length ? <>
          <label>Rekening tujuan<select value={accountId} onChange={e => setSelectedAccount(e.target.value)}>
            {settings.bankAccounts.map(a => <option key={a.id} value={a.id}>{a.bankName} · {a.accountNumber} · {a.accountHolder}</option>)}
          </select></label>
          {settings.bankAccounts.filter(a => a.id === accountId).map(a => <p className="notice" key={a.id}>{a.bankName}<br />{a.accountNumber}<br />a.n. {a.accountHolder}</p>)}
        </> : <p className="notice">Belum ada rekening. <Link to="/pengaturan">Tambahkan rekening di Pengaturan</Link>.</p>)}
        <p className="notice">Pastikan pembayaran {method} sudah diterima sebelum menyimpan.</p>
      </div>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button
        className="primary pay"
        disabled={!shiftOpen || !cart.length || busy || (method === "QRIS" && !settings.qris) || (method === "Transfer" && !accountId)}
        onClick={() => void pay()}
      >
        <CircleCheck size={18} />
        {busy ? "Menyimpan..." : !shiftOpen ? "Buka shift dahulu" : "Simpan transaksi"}
      </button>
    </section>
  );
}
