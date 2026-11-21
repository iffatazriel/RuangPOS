import type { BankAccount, Settings } from "./logic";

export function checkoutDetails(
  customerName: string,
  method: string,
  settings: Settings,
  accountId: string,
) {
  const name = customerName.trim();
  if (!name || name.length > 60)
    throw new Error("Nama pembeli wajib diisi (maksimal 60 karakter).");
  if (!["Tunai", "QRIS", "Transfer"].includes(method))
    throw new Error("Metode pembayaran tidak valid.");
  if (method === "QRIS" && !settings.qris)
    throw new Error("Unggah QRIS di Pengaturan terlebih dahulu.");
  let bankAccount: BankAccount | undefined;
  if (method === "Transfer") {
    const account = settings.bankAccounts.find((a) => a.id === accountId);
    if (!account)
      throw new Error("Pilih rekening transfer yang tersedia di Pengaturan.");
    bankAccount = { ...account };
  }
  return { customerName: name, ...(bankAccount ? { bankAccount } : {}) };
}
