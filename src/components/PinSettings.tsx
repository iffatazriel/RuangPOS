import { useState } from "react";
import { changePin } from "../lib/db";
import { Modal } from "./Modal";

export function PinSettings() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="panel">
      <h2>Keamanan</h2>
      <p className="notice">
        PIN tersimpan sebagai hash dengan salt. Otomatis terkunci setelah 15
        menit tanpa aktivitas. PIN tidak disertakan dalam cadangan. Ini kunci
        aplikasi lokal, bukan enkripsi data perangkat.
      </p>
      <button
        onClick={() => {
          setCurrent("");
          setNext("");
          setConfirm("");
          setMessage("");
          setOpen(true);
        }}
      >
        Ganti PIN
      </button>
      {message && !open && <p role="status">{message}</p>}
      {open && (
        <Modal
          title="Ganti PIN"
          close={() => {
            if (!busy) setOpen(false);
          }}
        >
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              setMessage("");
              if (next !== confirm) {
                setMessage("Konfirmasi PIN baru tidak sama.");
                return;
              }
              setBusy(true);
              try {
                await changePin(current, next);
                setOpen(false);
                setMessage("PIN berhasil diganti.");
              } catch (error) {
                setMessage((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {[
              ["PIN saat ini", current, setCurrent],
              ["PIN baru", next, setNext],
              ["Ulangi PIN baru", confirm, setConfirm],
            ].map(([label, value, setValue]) => (
              <label key={String(label)}>
                {String(label)}
                <input
                  required
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={String(value)}
                  onChange={(e) =>
                    (setValue as (value: string) => void)(
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                />
              </label>
            ))}
            {message && (
              <p className="error" role="alert">
                {message}
              </p>
            )}
            <button className="primary" disabled={busy}>
              Simpan PIN baru
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
