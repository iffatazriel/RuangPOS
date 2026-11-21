import { Routes, Route } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./lib/db";
import { Sidebar } from "./components/Sidebar";
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
      <Sidebar name={settings?.name} />
      <div className="shell">
        <Topbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kasir" element={<Kasir />} />
            <Route path="/produk" element={<Produk />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
