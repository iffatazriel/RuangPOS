import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LockKeyhole, Search, ShoppingBag, X } from "lucide-react";
import { Navigation } from "./Navigation";
import { ThemeToggle } from "./ThemeToggle";
export function Topbar({ name, lock }: { name?: string; lock: () => void }) {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="logo">
          <ShoppingBag size={23} strokeWidth={2.5} />
        </span>
        Ruang<span>POS</span>
        <span className="brand-dot" />
      </Link>
      <div className="topbar-right">
        <Navigation />
        <div className="nav-tools">
          <button
            className="icon-button header-search-toggle"
            aria-label="Buka pencarian produk"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={18} />
          </button>
          <ThemeToggle />
          <button className="icon-button" aria-label="Kunci" title="Kunci" onClick={lock}><LockKeyhole size={18} /></button>
          <div className="store-profile">
            <span className="avatar">
              {(name ?? "Usaha Anda")
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </span>
            <div>
              <strong>{name ?? "Usaha Anda"}</strong>
              <small>
                <span className="online" /> Tersimpan lokal
              </small>
            </div>
          </div>
        </div>
      </div>
      {searchOpen && (
        <form
          className="header-search search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/kasir?q=" + encodeURIComponent(search));
            setSearchOpen(false);
          }}
        >
          <Search size={18} />
          <input
            autoFocus
            aria-label="Cari produk"
            placeholder="Cari produk di semua kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="icon-button"
            aria-label="Tutup pencarian"
            onClick={() => setSearchOpen(false)}
          >
            <X size={16} />
          </button>
        </form>
      )}
    </header>
  );
}
