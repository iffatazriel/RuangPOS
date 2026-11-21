import { ArrowUpRight } from "lucide-react";
import type { stats } from "../lib/logic";
import { useData } from "../hooks/useData";
import { ProductImage } from "./ProductImage";
export function TopProducts({
  products,
}: {
  products: ReturnType<typeof stats>["top"];
}) {
  const { products: catalog } = useData();
  return (
    <section className="panel top-products">
      <div className="section-heading">
        <div>
          <h2>Produk terlaris</h2>
          <p>Favorit pelanggan hari ini</p>
        </div>
        <span className="pill">Top 5</span>
      </div>
      {products.length ? (
        products.map((p, i) => (
          <div className="top-product" key={p.name}>
            <span className="rank">0{i + 1}</span>
            <ProductImage
              photo={catalog.find((product) => product.name === p.name)?.photo}
              emoji={p.emoji}
              name={p.name}
              className="list-thumb"
            />
            <div>
              <strong>{p.name}</strong>
              <small>{p.qty} item terjual</small>
            </div>
            <ArrowUpRight size={16} />
          </div>
        ))
      ) : (
        <p className="no-data">Belum ada penjualan pada tanggal ini.</p>
      )}
      <div className="card-footer">
        Dibuat dengan semangat usaha kecil <span>✦</span>
      </div>
    </section>
  );
}
