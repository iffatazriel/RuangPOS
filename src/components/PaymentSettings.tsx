import { useState } from "react";
import { db, defaults } from "../lib/db";
import {
  validBankAccount,
  type BankAccount,
  type Settings,
} from "../lib/logic";
import { resizePhoto } from "../lib/photos";
import { ProductImage } from "./ProductImage";

type Payments = Pick<Settings, "qris" | "bankAccounts">;
export function PaymentSettings({ settings }: { settings: Settings }) {
  const [draft, setDraft] = useState<Payments | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const value = draft ?? settings;
  const changeAccount = (id: string, key: keyof BankAccount, text: string) =>
    setDraft({
      ...value,
      bankAccounts: value.bankAccounts.map((a) =>
        a.id === id ? { ...a, [key]: text } : a,
      ),
    });
  return (
    <section className="panel payment-settings">
      <div className="section-heading">
        <div>
          <h2>Pembayaran</h2>
          <p>QRIS dan rekening untuk menerima pembayaran pelanggan.</p>
        </div>
      </div>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!value.bankAccounts.every(validBankAccount)) {
            setMessage("Lengkapi semua kolom rekening.");
            return;
          }
          setBusy(true);
          try {
            const bankAccounts = value.bankAccounts.map((a) => ({
              ...a,
              bankName: a.bankName.trim(),
              accountNumber: a.accountNumber.trim(),
              accountHolder: a.accountHolder.trim(),
            }));
            await db.transaction("rw", db.settings, async () => {
              const current = (await db.settings.get("store")) ?? defaults;
              await db.settings.put({
                ...current,
                qris: value.qris,
                bankAccounts,
                id: "store",
              });
            });
            setDraft(null);
            setMessage("Pembayaran berhasil disimpan.");
          } catch {
            setMessage("Pembayaran gagal disimpan. Silakan coba lagi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h3>Gambar QRIS</h3>
        {value.qris ? (
          <ProductImage
            photo={value.qris}
            emoji=""
            name="Pratinjau QRIS"
            className="qris-image"
          />
        ) : (
          <p className="notice">
            Unggah gambar QRIS resmi usaha Anda. Gambar disimpan hanya di
            perangkat ini.
          </p>
        )}
        <label className="file-button">
          {busy ? "Memproses..." : "Unggah QRIS"}
          <input
            type="file"
            accept="image/*"
            aria-label="Unggah gambar QRIS"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setMessage("");
              try {
                const qris = await resizePhoto(file, {
                  maxSize: 1000,
                  type: "image/png",
                  quality: 1,
                });
                setDraft((current) => ({ ...(current ?? settings), qris }));
              } catch (error) {
                setMessage((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        <small>
          Maksimal 20 MB; diperkecil hingga 1000px sebagai PNG agar tetap tajam.
        </small>
        {value.qris && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setDraft({ ...value, qris: undefined })}
          >
            Hapus QRIS
          </button>
        )}
        <h3>Rekening bank</h3>
        {value.bankAccounts.map((account, index) => (
          <fieldset className="bank-account" key={account.id}>
            <legend>Rekening {index + 1}</legend>
            {(
              [
                ["bankName", "Nama bank"],
                ["accountNumber", "Nomor rekening"],
                ["accountHolder", "Nama pemilik rekening"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  maxLength={100}
                  value={account[key]}
                  onChange={(e) =>
                    changeAccount(account.id, key, e.target.value)
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="danger-text"
              disabled={busy}
              onClick={() =>
                setDraft({
                  ...value,
                  bankAccounts: value.bankAccounts.filter(
                    (a) => a.id !== account.id,
                  ),
                })
              }
            >
              Hapus rekening {index + 1}
            </button>
          </fieldset>
        ))}
        {!value.bankAccounts.length && (
          <p className="notice">
            Belum ada rekening. Tambahkan rekening agar Transfer tersedia di
            kasir.
          </p>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            setDraft({
              ...value,
              bankAccounts: [
                ...value.bankAccounts,
                {
                  id: crypto.randomUUID(),
                  bankName: "",
                  accountNumber: "",
                  accountHolder: "",
                },
              ],
            })
          }
        >
          Tambah rekening
        </button>
        <button className="primary" disabled={busy}>
          Simpan pembayaran
        </button>
        {message && <p role="status">{message}</p>}
      </form>
    </section>
  );
}
