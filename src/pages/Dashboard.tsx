import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ReceiptText, Wallet, ShoppingCart, Boxes, Sprout } from "lucide-react";
import { db } from "../lib/db";
import { day, rupiah, stats, series } from "../lib/logic";
import { Title } from "../components/Title";
import { Empty } from "../components/EmptyState";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { TopProducts } from "../components/TopProducts";

export function Dashboard() {
  const [date, setDate] = useState(day());
  const [period, setPeriod] = useState(7);
  const sales = useLiveQuery(() => db.sales.toArray()) ?? [];
  const products = useLiveQuery(() => db.products.count());
  const s = stats(sales, date);
  const chart = series(sales, date, period);
  const cards = [
    ["Pendapatan", rupiah(s.revenue), Wallet],
    ["Transaksi", String(s.count), ReceiptText],
    ["Rata-rata per transaksi", rupiah(s.average), ShoppingCart],
    ["Item terjual", String(s.quantity), Boxes],
  ] as const;
  return (
    <>
      <Title
        eyebrow="SELAMAT DATANG DI RUANG USAHA ANDA"
        title="Ringkasan usaha"
      >
        <input
          aria-label="Tanggal ringkasan"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value || day())}
        />
      </Title>
      <div className="intro-line">
        <span>Setiap transaksi, satu langkah lebih maju.</span>
        <span className="subtle">Semua dalam satu ruang.</span>
      </div>
      <div className="stats">
        {cards.map(([label, value, Icon], i) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            Icon={Icon}
            index={i}
          />
        ))}
      </div>
      {products === 0 && sales.length === 0 ? (
        <Empty />
      ) : (
        <div className="dashboard-grid">
          <TopProducts products={s.top} />
          <BarChart chart={chart} period={period} setPeriod={setPeriod} />
        </div>
      )}
      <div className="bottom-note">
        <Sprout size={16} /> Usaha Anda, data Anda. Tersimpan aman di perangkat
        ini.
      </div>
    </>
  );
}
