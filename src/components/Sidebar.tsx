import { NavLink } from "react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ReceiptText,
  Settings as SettingsIcon,
} from "lucide-react";
const nav = [
  ["/", "Ringkasan", LayoutDashboard],
  ["/kasir", "Kasir", ShoppingBag],
  ["/produk", "Produk", Package],
  ["/transaksi", "Transaksi", ReceiptText],
  ["/pengaturan", "Pengaturan", SettingsIcon],
] as const;

export function Sidebar({ name }: { name?: string }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/">
        <span className="logo">
          <ShoppingBag size={22} />
        </span>
        Ruang<span>POS</span>
      </a>
      <div className="workspace">
        <span className="store-avatar">☕</span>
        <div>
          <strong>{name ?? "Usaha Anda"}</strong>
          <small>Ruang usaha Anda</small>
        </div>
        <span className="online" />
      </div>
      <p className="nav-label">RUANG KERJA</p>
      <nav>
        {nav.map(([url, label, Icon]) => (
          <NavLink key={url} to={url} end={url === "/"}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="local">
          <span className="online" /> Lokal & aman
          <small>Data tersimpan di perangkat ini</small>
        </div>
        <p>© 2026 RuangPOS</p>
      </div>
    </aside>
  );
}
