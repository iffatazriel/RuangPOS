import { useCallback, useLayoutEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router";
import { DataProvider, useData } from "./hooks/useData";
import { useInactivityLock } from "./hooks/useInactivityLock";
import { Beranda } from "./pages/Beranda";
import { Navigation } from "./components/Navigation";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Kasir } from "./pages/Kasir";
import { Produk } from "./pages/Produk";
import { Transaksi } from "./pages/Transaksi";
import { Pengaturan } from "./pages/Pengaturan";

export default function App() {
  return <DataProvider><GuardedApp /></DataProvider>;
}
function GuardedApp() {
  const { settings } = useData();
  const [unlocked, setUnlocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const lock = useCallback(() => { setUnlocked(false); navigate("/", { replace: true }); }, [navigate]);
  useInactivityLock(unlocked, lock);
  useLayoutEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, [location.pathname, unlocked]);
  if (!unlocked || !settings.pin) return <Beranda unlock={() => { setUnlocked(true); navigate("/", { replace: true }); }} />;
  return (
    <div className="app">
      <div className="shell">
        <Topbar name={settings.name} lock={lock} />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kasir" element={<Kasir />} />
            <Route path="/produk" element={<Produk />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
