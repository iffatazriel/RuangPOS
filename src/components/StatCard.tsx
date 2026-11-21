import { ArrowUpRight, type LucideIcon } from "lucide-react";
export function StatCard({
  label,
  value,
  Icon,
  index: i,
}: {
  label: string;
  value: string;
  Icon: LucideIcon;
  index: number;
}) {
  return (
    <section className={"stat " + (!i ? "featured" : "")} key={label}>
      <div className="stat-top">
        <span className="icon-badge">
          <Icon size={21} />
        </span>
        <ArrowUpRight size={18} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>
        {i === 0
          ? "Penjualan bersih hari ini"
          : i === 1
            ? "Pesanan terselesaikan"
            : i === 2
              ? "Dari seluruh transaksi"
              : "Produk berhasil terjual"}
      </small>
    </section>
  );
}
