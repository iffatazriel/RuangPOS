import { rupiah } from "../lib/logic";
import { shortMoney } from "../lib/format";
export function BarChart({
  chart,
  period,
  setPeriod,
}: {
  chart: { date: string; value: number }[];
  period: number;
  setPeriod: (period: number) => void;
}) {
  const max = Math.max(...chart.map((c) => c.value), 100000);
  return (
    <section className="panel chart-panel">
      <div className="section-heading">
        <div>
          <h2>Grafik penjualan</h2>
          <p>Perjalanan pendapatan usaha Anda</p>
        </div>
        <select
          aria-label="Rentang grafik"
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
        >
          <option value={7}>Minggu</option>
          <option value={30}>Bulan</option>
        </select>
      </div>
      <div className="chart-legend">
        <span />
        Pendapatan{" "}
        <strong>{rupiah(chart.reduce((s, c) => s + c.value, 0))}</strong>
      </div>
      <div className="chart">
        <div className="y-axis">
          {[1, 0.75, 0.5, 0.25, 0].map((n) => (
            <span key={n}>{shortMoney(max * n)}</span>
          ))}
        </div>
        <div className="plot">
          <div className="grid-lines">
            {[0, 1, 2, 3, 4].map((n) => (
              <i key={n} />
            ))}
          </div>
          <div className="bars">
            {chart.map((c, i) => (
              <div className="bar-column" key={c.date}>
                <div
                  title={`${c.date}: ${rupiah(c.value)}`}
                  className="bar"
                  style={{ height: `${(c.value / max) * 100}%` }}
                />
                <span>
                  {period === 7
                    ? new Date(c.date + "T12:00").toLocaleDateString("id-ID", {
                        weekday: "short",
                      })
                    : i % 5 === 0
                      ? c.date.slice(8)
                      : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="chart-note">
        <span className="online" /> Tidak termasuk transaksi yang dibatalkan
      </div>
    </section>
  );
}
