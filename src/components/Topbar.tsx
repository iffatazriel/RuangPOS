import { useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";

export function Topbar() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  return (
    <header>
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/kasir?q=" + encodeURIComponent(search));
        }}
      >
        <Search size={19} />
        <input
          aria-label="Cari produk"
          placeholder="Cari produk di sini..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <kbd>↵</kbd>
      </form>
      <div className="header-right">
        <span className="offline">
          <span className="online" /> Siap offline
        </span>
        <span className="avatar">RK</span>
      </div>
    </header>
  );
}
