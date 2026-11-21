import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { ShoppingBag, Plus, Minus, CircleCheck, Trash2, X } from "lucide-react";
import {
  rupiah,
  type Product,
  type Line,
  type Settings,
  type totals,
} from "../lib/logic";
import { shortMoney } from "../lib/format";
type Props = {
  cart: Line[];
  setCart: Dispatch<SetStateAction<Line[]>>;
  products: Product[];
  update: (product: Product) => void;
  settings: Settings;
  sum: ReturnType<typeof totals>;
  discount: number;
  setDiscount: (value: number) => void;
  method: string;
  setMethod: (value: string) => void;
  cash: number;
  setCash: (value: number) => void;
  error: string;
  busy: boolean;
  pay: () => Promise<void>;
  close: () => void;
  modal: boolean;
};
export function CartPanel({
  cart,
  setCart,
  products,
  update,
  settings,
  sum,
  discount,
  setDiscount,
  method,
  setMethod,
  cash,
  setCash,
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
                      const p = products.find((p) => p.id === i.productId);
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
  );
}
