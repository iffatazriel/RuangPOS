import { day, type Sale } from "./logic";

export type ReportPeriod = "harian" | "mingguan" | "bulanan";
export function reportRange(period: ReportPeriod, reference: string) {
  const date = new Date(reference + "T12:00:00");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(reference) ||
    !Number.isFinite(date.getTime()) ||
    day(date) !== reference
  )
    throw new Error("Tanggal laporan tidak valid.");
  const start = new Date(date),
    end = new Date(date);
  if (period === "mingguan") {
    start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
  } else if (period === "bulanan") {
    start.setDate(1);
    end.setMonth(date.getMonth() + 1, 0);
  } else if (period !== "harian") throw new Error("Periode tidak valid.");
  return { start: day(start), end: day(end) };
}
export function aggregateReport(
  sales: Sale[],
  period: ReportPeriod,
  reference: string,
  generatedAt = new Date().toISOString(),
) {
  const range = reportRange(period, reference);
  const transactions = sales
    .filter((s) => {
      const date = day(new Date(s.date));
      return !s.voided && date >= range.start && date <= range.end;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const revenue = transactions.reduce((n, s) => n + s.total, 0);
  const products = new Map<
    string,
    { id: string; name: string; qty: number; revenue: number }
  >();
  for (const sale of transactions)
    for (const item of sale.items) {
      const product = products.get(item.productId) ?? {
        id: item.productId,
        name: item.name,
        qty: 0,
        revenue: 0,
      };
      product.qty += item.qty;
      product.revenue += item.price * item.qty;
      products.set(item.productId, product);
    }
  const days = [];
  for (
    const date = new Date(range.start + "T12:00:00");
    day(date) <= range.end;
    date.setDate(date.getDate() + 1)
  ) {
    const dateKey = day(date);
    const rows = transactions.filter((s) => day(new Date(s.date)) === dateKey);
    days.push({
      date: dateKey,
      count: rows.length,
      revenue: rows.reduce((n, s) => n + s.total, 0),
    });
  }
  return {
    period,
    reference,
    generatedAt,
    ...range,
    transactions,
    days,
    totals: {
      revenue,
      count: transactions.length,
      average: transactions.length
        ? Math.round(revenue / transactions.length)
        : 0,
      quantity: transactions
        .flatMap((s) => s.items)
        .reduce((n, i) => n + i.qty, 0),
      discount: transactions.reduce((n, s) => n + s.discount, 0),
      tax: transactions.reduce((n, s) => n + s.tax, 0),
    },
    payments: ["Tunai", "QRIS", "Transfer"].map((method) => {
      const rows = transactions.filter((s) => s.method === method);
      return {
        method,
        count: rows.length,
        revenue: rows.reduce((n, s) => n + s.total, 0),
      };
    }),
    products: [...products.values()].sort(
      (a, b) =>
        b.qty - a.qty ||
        b.revenue - a.revenue ||
        a.name.localeCompare(b.name, "id-ID"),
    ),
  };
}
export type SalesReport = ReturnType<typeof aggregateReport>;
export function reportFilename(report: SalesReport) {
  return `ruangpos-ringkasan-${report.period}-${report.period === "bulanan" ? report.reference.slice(0, 7) : report.start}.csv`;
}
export function reportCSV(report: SalesReport, storeName: string) {
  const t = report.totals;
  const rows: (string | number)[][] = [
    ["RINGKASAN USAHA", storeName],
    ["Periode", report.period, report.start, report.end],
    ["Dibuat pada", report.generatedAt],
    [],
    ["Ringkasan", "Nilai"],
    ["Pendapatan (Rp)", t.revenue],
    ["Transaksi", t.count],
    ["Rata-rata (Rp)", t.average],
    ["Item terjual", t.quantity],
    ["Diskon (Rp)", t.discount],
    ["PPN (Rp)", t.tax],
    [],
    ["Pembayaran", "Transaksi", "Pendapatan (Rp)"],
    ...report.payments.map((p) => [p.method, p.count, p.revenue]),
  ];
  if (report.period !== "harian")
    rows.push(
      [],
      ["Tanggal", "Transaksi", "Pendapatan (Rp)"],
      ...report.days.map((d) => [d.date, d.count, d.revenue]),
    );
  rows.push(
    [],
    ["Produk terlaris", "Qty", "Omzet sebelum diskon/PPN (Rp)"],
    ...report.products.map((p) => [p.name, p.qty, p.revenue]),
    [],
    ["Waktu", "Pembeli", "Metode", "Total (Rp)"],
    ...report.transactions.map((s) => [
      new Date(s.date).toLocaleString("id-ID"),
      s.customerName ?? "—",
      s.method,
      s.total,
    ]),
  );
  const cell = (value: string | number) => {
    const text =
      typeof value === "string" && /^[\s]*[=+\-@]/.test(value)
        ? "'" + value
        : String(value);
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return "\ufeff" + rows.map((row) => row.map(cell).join(";")).join("\r\n");
}
