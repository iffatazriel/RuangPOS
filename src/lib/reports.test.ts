import { expect, it } from "vitest";
import {
  aggregateReport,
  reportCSV,
  reportFilename,
  reportRange,
} from "./reports";
import type { Sale } from "./logic";
it("uses local calendar days, Monday–Sunday weeks and leap-year months", () => {
  expect(reportRange("harian", "2026-11-21")).toEqual({
    start: "2026-11-21",
    end: "2026-11-21",
  });
  expect(reportRange("mingguan", "2026-11-22")).toEqual({
    start: "2026-11-16",
    end: "2026-11-22",
  });
  expect(reportRange("mingguan", "2026-01-01")).toEqual({
    start: "2025-12-29",
    end: "2026-01-04",
  });
  expect(reportRange("bulanan", "2024-02-29")).toEqual({
    start: "2024-02-01",
    end: "2024-02-29",
  });
  for (const invalid of ["", "2026-02-30", "nonsense"])
    expect(() => reportRange("harian", invalid)).toThrow();
});
const sale: Sale = {
  id: "1",
  date: "2026-11-21T12:00:00",
  customerName: "=SUM(1;2)",
  items: [
    { productId: "p", name: 'Kopi; "Susu"', emoji: "", price: 1000, qty: 2 },
  ],
  subtotal: 2000,
  discount: 100,
  tax: 209,
  total: 2109,
  method: "QRIS",
  cash: 2109,
  voided: false,
};
it("aggregates non-voided sales, discounts, tax, payment methods and gross product revenue", () => {
  const report = aggregateReport(
    [
      sale,
      { ...sale, id: "2", method: "Tunai" },
      { ...sale, voided: true },
      { ...sale, date: "2026-10-01T12:00:00" },
    ],
    "mingguan",
    "2026-11-21",
  );
  expect(report.totals).toEqual({
    revenue: 4218,
    count: 2,
    average: 2109,
    quantity: 4,
    discount: 200,
    tax: 418,
  });
  expect(report.days).toHaveLength(7);
  expect(report.days.find((d) => d.date === "2026-11-21")).toMatchObject({
    count: 2,
    revenue: 4218,
  });
  expect(report.payments.map((p) => p.revenue)).toEqual([2109, 2109, 0]);
  expect(report.products[0]).toMatchObject({ qty: 4, revenue: 4000 });
});
it("exports BOM semicolon CSV with escaped text and formula protection", () => {
  const report = aggregateReport(
    [sale],
    "bulanan",
    "2026-11-21",
    "2026-11-21T13:00:00Z",
  );
  const csv = reportCSV(report, "Warung Melati");
  expect(csv.startsWith('\ufeff"RINGKASAN USAHA";"Warung Melati"')).toBe(true);
  expect(csv).toContain('"Kopi; ""Susu"""');
  expect(csv).toContain('"\'=SUM(1;2)"');
  expect(csv).toContain('"PPN (Rp)";"209"');
  expect(reportFilename(report)).toBe("ruangpos-ringkasan-bulanan-2026-11.csv");
});
it("handles empty periods with zero totals and complete daily rows", () => {
  const report = aggregateReport([], "bulanan", "2026-11-21");
  expect(report.totals).toEqual({
    revenue: 0,
    count: 0,
    average: 0,
    quantity: 0,
    discount: 0,
    tax: 0,
  });
  expect(report.days).toHaveLength(30);
  expect(report.products).toEqual([]);
  expect(reportCSV(report, "Warung")).toContain('"Transfer";"0";"0"');
});
