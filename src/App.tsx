import { Routes, Route } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./lib/db";
import { Navigation } from "./components/Navigation";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Kasir } from "./pages/Kasir";
import { Produk } from "./pages/Produk";
import { Transaksi } from "./pages/Transaksi";
import { Pengaturan } from "./pages/Pengaturan";

export default function App() {
  const settings = useLiveQuery(() => db.settings.get("store"));
  return (
    <div className="app">
      <div className="shell">
        <Topbar name={settings?.name} />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kasir" element={<Kasir />} />
            <Route path="/produk" element={<Produk />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <span>© 2026 RuangPOS</span>
          <span>Dibuat untuk usaha kecil, dengan sepenuh hati.</span>
          <span>Data Anda tetap di perangkat ini.</span>
        </footer>
      </div>
      <Navigation mobile />
    </div>
  );
}
