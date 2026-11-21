import { expect, it } from "vitest";
import { checkoutDetails } from "./payments";
import { defaults } from "./db";
import {
  migrateSettings,
  PPN_RATE,
  totals,
  validateBackup,
  type BankAccount,
} from "./logic";

const account: BankAccount = {
  id: "bank-1",
  bankName: "BCA",
  accountNumber: "00123456",
  accountHolder: "Warung Melati",
};
const settings = {
  ...defaults,
  bankAccounts: [account],
  qris: new Blob(["qris"], { type: "image/png" }),
};
const items = [
  { productId: "p", name: "Kopi", emoji: "", price: 10005, qty: 2 },
];
const backup = {
  version: 1,
  products: [],
  categories: [],
  sales: [],
  settings: { ...defaults, qris: undefined },
};

it("applies the fixed PPN rate after discount only when enabled", () => {
  for (const enabled of [false, true]) {
    const total = totals(items, 1000, enabled ? PPN_RATE : 0);
    expect(total).toEqual({
      subtotal: 20010,
      discount: 1000,
      tax: enabled ? 2091 : 0,
      total: enabled ? 21101 : 19010,
    });
    expect(totals([], 1000, enabled ? PPN_RATE : 0).total).toBe(0);
    expect(totals(items, 99999, enabled ? PPN_RATE : 0).total).toBe(0);
  }
});
it("migrates both legacy tax field names and preserves an explicit toggle", () => {
  const legacy = { name: "Warung", address: "", phone: "", footer: "" };
  expect(migrateSettings(legacy)).toEqual({
    ...legacy,
    taxEnabled: false,
    bankAccounts: [],
  });
  expect(migrateSettings({ ...legacy, tax: 5 }).taxEnabled).toBe(true);
  expect(migrateSettings({ ...legacy, taxPercent: 10 }).taxEnabled).toBe(true);
  expect(migrateSettings({ ...legacy, taxPercent: 0 }).taxEnabled).toBe(false);
  expect(
    migrateSettings({ ...legacy, tax: 5, taxEnabled: false }).taxEnabled,
  ).toBe(false);
  expect(migrateSettings(settings)).toEqual(settings);
  expect(migrateSettings({ ...legacy, tax: 5 })).not.toHaveProperty("tax");
});
it("requires a trimmed customer name and snapshots the selected transfer account", () => {
  expect(checkoutDetails("  Siti  ", "Tunai", defaults, "")).toEqual({
    customerName: "Siti",
  });
  for (const name of ["", "  ", "a".repeat(61)])
    expect(() => checkoutDetails(name, "Tunai", defaults, "")).toThrow(
      "Nama pembeli",
    );
  const details = checkoutDetails("Siti", "Transfer", settings, account.id);
  expect(details.bankAccount).toEqual(account);
  expect(details.bankAccount).not.toBe(account);
  expect(checkoutDetails("Siti", "QRIS", settings, "")).toEqual({
    customerName: "Siti",
  });
  expect(() => checkoutDetails("Siti", "QRIS", defaults, "")).toThrow(
    "Unggah QRIS",
  );
  expect(() => checkoutDetails("Siti", "Transfer", defaults, "")).toThrow(
    "Pilih rekening",
  );
  expect(() =>
    checkoutDetails("Siti", "Transfer", settings, "deleted"),
  ).toThrow("Pilih rekening");
  expect(() => checkoutDetails("Siti", "Unknown", settings, "")).toThrow(
    "Metode pembayaran",
  );
});
it("accepts payment backups and migrates legacy settings without payment data", () => {
  const png =
    "data:image/png;base64," + btoa("\x89PNG\r\n\x1a\nIEND\xaeB\x60\x82");
  const portable = {
    ...backup,
    settings: {
      ...backup.settings,
      qris: png,
      bankAccounts: [account],
      taxEnabled: true,
    },
  };
  expect(validateBackup(portable)).toEqual(portable);
  const legacy = {
    name: "Warung",
    address: "",
    phone: "",
    footer: "",
    taxPercent: 5,
  };
  expect(
    validateBackup({ ...backup, settings: legacy }).settings,
  ).toMatchObject({ taxEnabled: true, bankAccounts: [] });
  expect(
    validateBackup({ ...backup, settings: { ...legacy, taxPercent: 0 } })
      .settings.taxEnabled,
  ).toBe(false);
});
it("rejects malformed payment settings and sale metadata", () => {
  for (const extra of [
    { taxEnabled: "yes" },
    { taxPercent: -1 },
    { qris: {} },
    { qris: "data:image/png;base64,YWJj" },
    { qris: "data:text/html;base64,YWJj" },
    { qris: "data:image/png;base64," + "A".repeat(8_000_000) },
    { bankAccounts: {} },
    { bankAccounts: [account, account] },
    { bankAccounts: [{ ...account, accountNumber: 123 }] },
    { bankAccounts: [{ ...account, bankName: " " }] },
    { bankAccounts: [{ ...account, accountHolder: "a".repeat(101) }] },
  ])
    expect(() =>
      validateBackup({ ...backup, settings: { ...backup.settings, ...extra } }),
    ).toThrow("Pengaturan tidak valid");
  const sale = {
    id: "s",
    date: new Date().toISOString(),
    items,
    ...totals(items, 0, 0),
    method: "Transfer",
    cash: 20010,
    voided: false,
    customerName: "Siti",
    bankAccount: account,
    taxEnabled: false,
  };
  expect(validateBackup({ ...backup, sales: [sale] }).sales).toEqual([sale]);
  const {
    customerName: _name,
    bankAccount: _bank,
    taxEnabled: _tax,
    ...legacy
  } = sale;
  void _name;
  void _bank;
  void _tax;
  expect(validateBackup({ ...backup, sales: [legacy] }).sales).toEqual([
    legacy,
  ]);
  for (const extra of [
    { customerName: " " },
    { customerName: "a".repeat(61) },
    { bankAccount: {} },
    { taxEnabled: 1 },
  ])
    expect(() =>
      validateBackup({ ...backup, sales: [{ ...sale, ...extra }] }),
    ).toThrow("Transaksi tidak valid");
});
