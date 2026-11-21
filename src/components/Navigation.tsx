import { NavLink } from "react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ReceiptText,
  Settings,
} from "lucide-react";
const links = [
  ["/", "Ringkasan", LayoutDashboard],
  ["/kasir", "Kasir", ShoppingBag],
  ["/produk", "Produk", Package],
  ["/transaksi", "Transaksi", ReceiptText],
  ["/pengaturan", "Pengaturan", Settings],
] as const;
export function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? "Navigasi seluler" : "Navigasi utama"}
      className={mobile ? "bottom-nav" : "desktop-nav"}
    >
      {links.map(([url, label, Icon]) => (
        <NavLink key={url} to={url} end={url === "/"}>
          <Icon size={19} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
