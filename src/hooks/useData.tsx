import { createContext, useContext, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, defaults } from "../lib/db";

async function loadData() {
  return db.transaction("r", db.tables, async () => ({
    products: await db.products.toArray(),
    categories: await db.categories.toArray(),
    sales: await db.sales.orderBy("date").reverse().toArray(),
    settings: (await db.settings.get("store")) ?? defaults,
  }));
}
const DataContext = createContext<Awaited<ReturnType<typeof loadData>> | null>(
  null,
);
export function DataProvider({ children }: { children: ReactNode }) {
  const data = useLiveQuery(loadData);
  if (!data)
    return (
      <div
        className="loading-screen"
        role="status"
        aria-label="Memuat data usaha"
      >
        <div className="skeleton" />
        <div className="skeleton" />
        <p>Menyiapkan ruang usaha Anda…</p>
      </div>
    );
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error("Data usaha belum tersedia.");
  return data;
}
