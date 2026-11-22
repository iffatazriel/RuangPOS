import { PPN_RATE, rupiah, type Sale, type Settings } from "./logic";
import { optionText } from "./options";

export function normalizePhone(input: string) {
  const value = input.trim();
  if (!value) return "";
  if (!/^\+?[\d\s().-]+$/.test(value)) throw new Error("Nomor WhatsApp tidak valid.");
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("08")) digits = "62" + digits.slice(1);
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error("Gunakan nomor WhatsApp 8–15 digit, misalnya 081234567890 atau +6281234567890.");
  return digits;
}
export function receiptText(sale: Sale, settings: Settings) {
  const lines = [settings.name, ...[settings.address, settings.phone].filter(Boolean), "", `STRUK #${sale.id.slice(0, 8).toUpperCase()}`, new Date(sale.date).toLocaleString("id-ID")];
  if (sale.voided) lines.push("DIBATALKAN");
  lines.push(`Pembeli: ${sale.customerName ?? "—"}`, "------------------------------");
  for (const item of sale.items) {
    lines.push(`${item.qty}× ${item.name} @ ${rupiah(item.price)} = ${rupiah(item.price * item.qty)}`);
    if (item.selectedOptions?.length) lines.push(`  ${optionText(item)}`);
  }
  lines.push("------------------------------", `Subtotal: ${rupiah(sale.subtotal)}`, `Diskon: ${rupiah(sale.discount)}`, `${sale.taxEnabled === undefined ? "Pajak" : `PPN ${PPN_RATE}%`}: ${rupiah(sale.tax)}`, `TOTAL: ${rupiah(sale.total)}`, `Pembayaran: ${sale.method}`, `Dibayar: ${rupiah(sale.cash)}`, `Kembalian: ${rupiah(Math.max(0, sale.cash - sale.total))}`);
  if (sale.bankAccount) lines.push(`Bank: ${sale.bankAccount.bankName}`, `Rekening: ${sale.bankAccount.accountNumber}`, `a.n. ${sale.bankAccount.accountHolder}`);
  lines.push("", settings.footer, "RuangPOS · Kasir lokal untuk usaha Anda");
  return lines.join("\n");
}
export function whatsAppReceiptURL(phone: string, text: string) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}
export function wrapReceiptText(text: string, measure: (text: string) => number, width: number) {
  if (!(width > 0)) throw new Error("Lebar gambar tidak valid.");
  return text.split("\n").flatMap(paragraph => {
    const lines: string[] = [];
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= width) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      for (const char of word) {
        if (line && measure(line + char) > width) { lines.push(line); line = ""; }
        line += char;
      }
    }
    lines.push(line);
    return lines;
  });
}
