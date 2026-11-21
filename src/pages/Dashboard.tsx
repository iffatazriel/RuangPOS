import { useState } from "react";
import { useData } from "../hooks/useData";
import { ReceiptText, Wallet, ShoppingCart, Boxes, Sprout } from "lucide-react";
import { ReportExport } from "../components/ReportExport";
import { day, rupiah, stats, series } from "../lib/logic";
import { Title } from "../components/Title";
import { Empty } from "../components/EmptyState";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { TopProducts } from "../components/TopProducts";
import { LowStockWarning } from "../components/LowStockWarning";

export function Dashboard() {
  const [date, setDate] = useState(day());
  const [period, setPeriod] = useState(7);
  const { sales, products, settings } = useData();
  const [exportOpen, setExportOpen] = useState(false);
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
        <div className="actions">
        <button onClick={() => setExportOpen(true)}>Export</button>
        <input
          aria-label="Tanggal ringkasan"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value || day())}
        />
        </div>
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
      {products.length === 0 && sales.length === 0 ? (
        <Empty />
      ) : (
        <div className="dashboard-grid">
          <TopProducts products={s.top} />
          <BarChart chart={chart} period={period} setPeriod={setPeriod} />
        </div>
      )}
      <LowStockWarning />
      <div className="bottom-note">
        <Sprout size={16} /> Usaha Anda, data Anda. Tersimpan aman di perangkat
        ini.
      </div>
      {exportOpen && <ReportExport date={date} sales={sales} storeName={settings.name} close={() => setExportOpen(false)} />}
    </>
  );
}
