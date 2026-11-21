import { useNavigate } from "react-router";
import { seed } from "../lib/db";

export function Empty() {
  const navigate = useNavigate();
  return (
    <div className="empty panel">
      <span className="empty-icon">🌱</span>
      <h2>Usaha besar dimulai dari sini.</h2>
      <p>
        Tambahkan produk pertama Anda, atau jelajahi RuangPOS dengan data
        contoh.
      </p>
      <div className="actions">
        <button className="primary" onClick={() => navigate("/produk")}>
          Tambah produk
        </button>
        <button
          onClick={() => {
            if (confirm("Isi data contoh? Data saat ini akan diganti."))
              void seed();
          }}
        >
          Isi data contoh
        </button>
      </div>
    </div>
  );
}
