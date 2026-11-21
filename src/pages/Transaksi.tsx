import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, defaults, voidSale } from "../lib/db";
import { day, rupiah, type Sale } from "../lib/logic";
import { Title } from "../components/Title";
import { Receipt } from "../components/Receipt";

export function Transaksi() {
  const sales =
    useLiveQuery(() => db.sales.orderBy("date").reverse().toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.get("store")) ?? defaults;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(day());
  const [detail, setDetail] = useState<Sale | null>(null);
  const [query, setQuery] = useState("");
  const filtered = sales.filter(
    (s) =>
      (!from || day(new Date(s.date)) >= from) &&
      (!to || day(new Date(s.date)) <= to) &&
      (s.customerName ?? "").toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")),
  );
  return (
    <>
      <Title eyebrow="CATATAN SETIAP LANGKAH USAHA" title="Riwayat transaksi">
        <span className="pill">{filtered.length} transaksi</span>
      </Title>
      <div className="panel">
        <div className="section-heading">
          <h2>Semua transaksi</h2>
          <div className="actions">
            <input aria-label="Cari nama pembeli" placeholder="Cari nama pembeli..." value={query} onChange={e => setQuery(e.target.value)} />
            <input
              aria-label="Dari tanggal"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span>—</span>
            <input
              aria-label="Sampai tanggal"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID / Waktu</th>
                <th>Pesanan</th>
                <th>Pembeli</th>
                <th>Pembayaran</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>#{s.id.slice(0, 8).toUpperCase()}</strong>
                    <small>{new Date(s.date).toLocaleString("id-ID")}</small>
                  </td>
                  <td>
                    {s.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </td>
                  <td>{s.customerName ?? "—"}</td>
                  <td>{s.method}</td>
                  <td>{rupiah(s.total)}</td>
                  <td>
                    <span className={"status " + (s.voided ? "muted" : "")}>
                      {s.voided ? "Dibatalkan" : "Selesai"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => setDetail(s)}>Detail</button>
                      {!s.voided && (
                        <button
                          className="danger-text"
                          onClick={() => {
                            if (
                              confirm(
                                "Batalkan transaksi? Stok akan dikembalikan.",
                              )
                            )
                              void voidSale(s.id);
                          }}
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="no-data">Belum ada transaksi pada rentang ini.</p>
          )}
        </div>
      </div>
      {detail && (
        <Receipt
          sale={detail}
          settings={settings}
          close={() => setDetail(null)}
        />
      )}
    </>
  );
}
