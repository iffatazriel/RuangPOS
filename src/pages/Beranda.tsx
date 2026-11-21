import { useEffect, useRef, useState } from "react";
import { Delete, LockKeyhole, ShoppingBag } from "lucide-react";
import { useData } from "../hooks/useData";
import { attemptUnlock, resetAllData, setupPin } from "../lib/db";
import { cooldownSeconds, emptyAttempts, shouldSubmitPinOnEnter } from "../lib/pin";
import { Modal } from "../components/Modal";
import { ThemeToggle } from "../components/ThemeToggle";

export function Beranda({ unlock }: { unlock: () => void }) {
  const { settings } = useData();
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const [forgot, setForgot] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [shake, setShake] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const creating = !settings.pin;
  const cooldown = cooldownSeconds(
    settings.pinLock ?? emptyAttempts,
    now.getTime(),
  );
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        forgot ||
        busy ||
        cooldown ||
        event.target instanceof HTMLInputElement
      )
        return;
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        setPin((value) => (value + event.key).slice(0, 6));
      } else if (event.key === "Backspace") {
        event.preventDefault();
        setPin((value) => value.slice(0, -1));
      } else if (event.key === "Enter") {
        const activationTarget = event.target instanceof Element ? event.target.closest("button, a") : null;
        if (!shouldSubmitPinOnEnter(activationTarget?.tagName)) return;
        event.preventDefault();
        form.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [forgot, busy, cooldown]);
  const greeting =
    now.getHours() < 11
      ? "Selamat pagi"
      : now.getHours() < 15
        ? "Selamat siang"
        : now.getHours() < 18
          ? "Selamat sore"
          : "Selamat malam";
  return (
    <div className="welcome">
      <header className="welcome-nav">
        <div className="brand">
          <ShoppingBag /> Ruang<span>POS</span>
        </div>
        <ThemeToggle />
      </header>
      <main className="welcome-grid">
        <section className="welcome-copy">
          <p className="eyebrow">RUANG UNTUK USAHA ANDA</p>
          <h1>
            {greeting},<br />
            {settings.name}.
          </h1>
          <p>
            Satu langkah kecil hari ini,
            <br />
            cerita besar untuk usaha Anda.
          </p>
          <time dateTime={now.toISOString()}>
            {now.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            <strong>
              {now.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </time>
          <small>Data tetap di perangkat ini. Tanpa akun, tanpa server.</small>
        </section>
        <section className="panel pin-card">
          <span className="pin-badge">
            <LockKeyhole />
          </span>
          <h2>
            {creating
              ? firstPin === null
                ? "Buat PIN"
                : "Ulangi PIN"
              : "Selamat datang kembali"}
          </h2>
          <p>
            {creating
              ? "Lindungi ruang usaha Anda dengan PIN 6 digit."
              : "Masukkan PIN untuk membuka kasir."}
          </p>
          <form
            ref={form}
            className="pin-form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy || cooldown) return;
              setError("");
              if (!/^\d{6}$/.test(pin)) {
                setError("Masukkan 6 angka PIN.");
                return;
              }
              if (creating && firstPin === null) {
                setFirstPin(pin);
                setPin("");
                return;
              }
              if (creating && pin !== firstPin) {
                setError("PIN tidak sama. Ulangi konfirmasi PIN.");
                setPin("");
                setShake((value) => value + 1);
                return;
              }
              setBusy(true);
              try {
                if (creating) await setupPin(pin);
                else await attemptUnlock(pin);
                setPin("");
                setFirstPin(null);
                unlock();
              } catch (error) {
                setError((error as Error).message);
                setPin("");
                setShake((value) => value + 1);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div
              className={error ? "pin-entry pin-shake" : "pin-entry"}
              key={shake}
            >
              <input
                autoFocus
                aria-label={creating ? "PIN baru 6 digit" : "PIN 6 digit"}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                disabled={busy || cooldown > 0}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </div>
            <div className="pin-pad">
              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "Hapus",
                "0",
                "⌫",
              ].map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key === "⌫" ? "Hapus angka terakhir" : key}
                  disabled={busy || cooldown > 0}
                  onClick={() =>
                    setPin((value) =>
                      key === "Hapus"
                        ? ""
                        : key === "⌫"
                          ? value.slice(0, -1)
                          : (value + key).slice(0, 6),
                    )
                  }
                >
                  {key === "⌫" ? <Delete size={20} /> : key}
                </button>
              ))}
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {cooldown > 0 && (
              <p role="status" className="notice">
                Coba lagi dalam {cooldown} detik.
              </p>
            )}
            <button className="primary" disabled={busy || cooldown > 0}>
              {busy
                ? "Memeriksa..."
                : creating
                  ? firstPin === null
                    ? "Lanjutkan"
                    : "Simpan PIN"
                  : "Buka RuangPOS"}
            </button>
            {creating && firstPin !== null && (
              <button
                type="button"
                onClick={() => {
                  setFirstPin(null);
                  setPin("");
                  setError("");
                }}
              >
                Buat ulang PIN
              </button>
            )}
          </form>
          {!creating && (
            <button
              className="forgot-pin"
              onClick={() => {
                setConfirmation("");
                setForgot(true);
              }}
            >
              Lupa PIN?
            </button>
          )}
        </section>
      </main>
      {forgot && (
        <Modal title="Lupa PIN?" close={() => setForgot(false)}>
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              if (confirmation !== "HAPUS" || busy) return;
              setBusy(true);
              try {
                await resetAllData();
                setForgot(false);
                setPin("");
                setFirstPin(null);
                setError("");
              } catch {
                setError("Data gagal dihapus. Silakan coba lagi.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <p className="notice">
              PIN tidak dapat dipulihkan. Satu-satunya reset adalah menghapus
              SEMUA data usaha di perangkat ini, termasuk produk, transaksi, dan
              pengaturan. Tindakan ini tidak dapat dibatalkan. Cadangan tidak
              menyimpan PIN.
            </p>
            <label>
              Ketik HAPUS untuk menghapus semua data
              <input
                autoComplete="off"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <button
              className="danger-text"
              disabled={confirmation !== "HAPUS" || busy}
            >
              Hapus semua data dan reset PIN
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
