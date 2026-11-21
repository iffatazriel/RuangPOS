import type { Sale } from "./logic";

export interface ShiftSummary {
  count: number;
  revenue: number;
  payments: { method: string; count: number; total: number }[];
  expectedCash: number;
  countedCash: number;
  difference: number;
  saleIds: string[];
}
export interface Shift {
  id: string;
  openedAt: string;
  openingCash: number;
  cashierName?: string;
  status: "open" | "closed";
  closedAt?: string;
  note?: string;
  summary?: ShiftSummary;
}
export function wholeRupiah(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Jumlah harus berupa Rupiah bulat, minimal nol.");
  return value;
}
export function summarizeShift(shift: Pick<Shift, "id" | "openingCash">, sales: Sale[], countedCash: number): ShiftSummary {
  wholeRupiah(shift.openingCash);
  wholeRupiah(countedCash);
  const rows = sales.filter(s => s.shiftId === shift.id && !s.voided);
  const payments = ["Tunai", "QRIS", "Transfer"].map(method => {
    const matching = rows.filter(s => s.method === method);
    return { method, count: matching.length, total: wholeRupiah(matching.reduce((n, s) => n + wholeRupiah(s.total), 0)) };
  });
  const expectedCash = wholeRupiah(shift.openingCash + payments[0].total);
  return { count: rows.length, revenue: wholeRupiah(payments.reduce((n, p) => n + p.total, 0)), payments, expectedCash, countedCash, difference: countedCash - expectedCash, saleIds: rows.map(s => s.id) };
}
export function voidsAfterClose(shift: Shift, sales: Sale[]) {
  return shift.status === "closed" ? sales.filter(s => s.voided && shift.summary?.saleIds.includes(s.id)) : [];
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const money = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const date = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));
export function validShift(v: unknown): v is Shift {
  if (!record(v) || typeof v.id !== "string" || !v.id || !date(v.openedAt) || !money(v.openingCash) ||
    (v.cashierName !== undefined && (typeof v.cashierName !== "string" || v.cashierName.length > 60)) ||
    (v.note !== undefined && (typeof v.note !== "string" || v.note.length > 500))) return false;
  if (v.status === "open") return v.closedAt === undefined && v.summary === undefined;
  if (v.status !== "closed" || !date(v.closedAt) || Date.parse(v.closedAt) < Date.parse(v.openedAt) || !record(v.summary)) return false;
  const s = v.summary;
  if (![s.count, s.revenue, s.expectedCash, s.countedCash].every(money) || !Number.isSafeInteger(s.difference) ||
    !Array.isArray(s.saleIds) || !s.saleIds.every(id => typeof id === "string" && id.length > 0) ||
    new Set(s.saleIds).size !== s.saleIds.length || s.saleIds.length !== s.count ||
    !Array.isArray(s.payments) || s.payments.length !== 3) return false;
  const methods = ["Tunai", "QRIS", "Transfer"];
  if (!s.payments.every((p, i) => record(p) && p.method === methods[i] && money(p.count) && money(p.total))) return false;
  return s.payments.reduce((n, p) => n + p.count, 0) === s.count &&
    s.payments.reduce((n, p) => n + p.total, 0) === s.revenue &&
    v.openingCash + s.payments[0].total === s.expectedCash &&
    (s.countedCash as number) - (s.expectedCash as number) === s.difference;
}
