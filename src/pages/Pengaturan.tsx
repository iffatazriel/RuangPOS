import { useState } from "react";
import { useData } from "../hooks/useData";
import { ShoppingBag, X, Download, Upload, Sprout, Trash2 } from "lucide-react";
import { db, defaults, seed, getBackup, replaceData, resetAllData } from "../lib/db";
import { day, PPN_RATE, validateBackup, type Settings } from "../lib/logic";
import { Title } from "../components/Title";
import { PaymentSettings } from "../components/PaymentSettings";
import { PinSettings } from "../components/PinSettings";
import { About } from "../components/About";

export function Pengaturan() {
  const { settings } = useData();
  const [form, setForm] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const s = form ?? settings ?? defaults;
  const change = (key: keyof Settings, value: string | boolean) =>
    setForm({ ...s, [key]: value });
  async function exportData() {
    const b = await getBackup();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(b, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ruangpos-${day()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function importData(file: File) {
    try {
      const b = validateBackup(JSON.parse(await file.text()));
      if (confirm("Ganti SEMUA data di perangkat ini dengan cadangan?")) {
        await replaceData(b);
        setForm(null);
        setMessage("Cadangan berhasil dipulihkan.");
      }
    } catch (e) {
      setMessage("Gagal impor: " + (e as Error).message);
    }
  }
  return (
    <>
      <Title eyebrow="SESUAIKAN RUANG ANDA" title="Pengaturan" />
      <div className="settings-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Profil usaha</h2>
              <p>Informasi ini akan tampil di struk pelanggan.</p>
            </div>
            <span className="icon-badge">
              <ShoppingBag size={20} />
            </span>
          </div>
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              await db.transaction("rw", db.settings, async () => {
                const current = (await db.settings.get("store")) ?? defaults;
                const { name, address, phone, footer, taxEnabled } = s;
                await db.settings.put({ ...current, name, address, phone, footer, taxEnabled, id: "store" });
              });
              setForm(null);
              setMessage("Pengaturan berhasil disimpan.");
            }}
          >
            {(
              [
                ["name", "Nama usaha"],
                ["address", "Alamat"],
                ["phone", "Nomor telepon"],
                ["footer", "Pesan di struk"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required={key === "name"}
                  value={s[key]}
                  onChange={(e) => change(key, e.target.value)}
                />
              </label>
            ))}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={s.taxEnabled}
                onChange={(e) => change("taxEnabled", e.target.checked)}
              />
              Aktifkan PPN {PPN_RATE}%
            </label>
            <button className="primary">Simpan pengaturan</button>
          </form>
        </section>
        <div className="settings-side">
          <PaymentSettings settings={settings ?? defaults} />
          <PinSettings />
          <About />
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Data milik Anda</h2>
                <p>Tanpa server. Tanpa akun. Sepenuhnya lokal.</p>
              </div>
              <Download size={21} />
            </div>
            <p className="notice">
              Data disimpan di browser perangkat ini. Menghapus data browser
              dapat menghilangkan data usaha. Lakukan backup secara berkala.
            </p>
            <div className="backup-actions">
              <button onClick={() => void exportData()}>
                <Download size={17} /> Ekspor cadangan JSON
              </button>
              <label className="file-button">
                <Upload size={17} /> Impor cadangan JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importData(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>
          <section className="panel">
            <h2>Mulai menjelajah</h2>
            <p className="notice">
              Coba produk dan transaksi contoh selama 30 hari. Data saat ini
              akan diganti.
            </p>
            <button
              onClick={async () => {
                if (confirm("Ganti data saat ini dengan data contoh?")) {
                  await seed();
                  setForm(null);
                  setMessage("Data contoh siap digunakan.");
                }
              }}
            >
              <Sprout size={17} /> Isi data contoh
            </button>
          </section>
          <section className="panel danger-panel">
            <h2>Zona hati-hati</h2>
            <p className="notice">
              Hapus seluruh produk, transaksi, dan pengaturan. Tidak dapat
              dibatalkan.
            </p>
            <button
              className="danger-text"
              onClick={async () => {
                if (
                  confirm(
                    "Hapus SEMUA data? Pastikan Anda sudah membuat backup.",
                  ) &&
                  confirm("Anda yakin? Semua data akan hilang permanen.")
                ) {
                  await resetAllData();
                  setForm(null);
                  setMessage("Semua data telah dihapus.");
                }
              }}
            >
              <Trash2 size={16} /> Hapus semua data
            </button>
          </section>
        </div>
      </div>
      {message && (
        <div role="status" className="toast" onClick={() => setMessage("")}>
          {message} <X size={16} />
        </div>
      )}
    </>
  );
}
