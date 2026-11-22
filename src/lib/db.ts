import Dexie, { type EntityTable } from "dexie";
import { photoDataURL, photoBlob } from "./photos";
import {
  totals,
  stockAfterVoid,
  migrateSettings,
  withoutPin,
  type Product,
  type Category,
  type Sale,
  type Settings,
  type Backup,
} from "./logic";
import { createPin, verifyPin, cooldownSeconds, nextPinAttempt, emptyAttempts } from "./pin";
import { summarizeShift, wholeRupiah, type Shift } from "./shifts";
import { optionLine } from "./options";
export const defaults: Settings = {
  name: "Ruang Kopi",
  address: "Jl. Melati No. 12, Bandung",
  phone: "",
  footer: "Terima kasih, sampai jumpa kembali!",
  taxEnabled: false,
  bankAccounts: [],
};
const db = new Dexie("ruangpos") as Dexie & {
  products: EntityTable<Product, "id">;
  categories: EntityTable<Category, "id">;
  sales: EntityTable<Sale, "id">;
  settings: EntityTable<Settings & { id: string }, "id">;
  shifts: EntityTable<Shift, "id">;
};
db.version(1).stores({
  products: "id, category, active",
  categories: "id",
  sales: "id, date",
  settings: "id",
});
db.version(2).stores({
  products: "id, category, active",
  categories: "id",
  sales: "id, date",
  settings: "id",
});
db.version(3)
  .stores({
    products: "id, category, active",
    categories: "id",
    sales: "id, date",
    settings: "id",
  })
  .upgrade(tx => tx.table("settings").toCollection().modify(settings => {
    const migrated = migrateSettings(settings);
    delete settings.tax;
    delete settings.taxPercent;
    Object.assign(settings, migrated);
  }));
export { db };
db.version(4).stores({
  products: "id, category, active",
  categories: "id",
  sales: "id, date",
  settings: "id",
});
db.version(5).stores({
  products: "id, category, active",
  categories: "id",
  sales: "id, date, shiftId",
  settings: "id",
  shifts: "id, status, openedAt",
}).upgrade(tx => tx.table("products").toCollection().modify(product => {
  product.optionGroups ??= [];
}));
db.version(6).stores({
  products: "id, category, active",
  categories: "id",
  sales: "id, date, shiftId",
  settings: "id",
  shifts: "id, status, openedAt",
}).upgrade(tx => tx.table("products").toCollection().modify(product => {
  product.minStock ??= 0;
}));
export async function openShift(openingCash: number, cashierName: string) {
  wholeRupiah(openingCash);
  if (cashierName.trim().length > 60) throw new Error("Nama kasir maksimal 60 karakter.");
  return db.transaction("rw", db.shifts, async () => {
    if (await db.shifts.where("status").equals("open").count()) throw new Error("Masih ada shift terbuka.");
    const shift: Shift = { id: crypto.randomUUID(), openedAt: new Date().toISOString(), openingCash, cashierName: cashierName.trim(), status: "open" };
    await db.shifts.add(shift);
    return shift;
  });
}
export async function closeShift(id: string, countedCash: number, note: string) {
  wholeRupiah(countedCash);
  if (note.trim().length > 500) throw new Error("Catatan maksimal 500 karakter.");
  await db.transaction("rw", db.shifts, db.sales, async () => {
    const shift = await db.shifts.get(id);
    if (!shift || shift.status !== "open") throw new Error("Shift sudah ditutup atau tidak ditemukan.");
    const sales = await db.sales.where("shiftId").equals(id).toArray();
    await db.shifts.update(id, { status: "closed", closedAt: new Date().toISOString(), note: note.trim(), summary: summarizeShift(shift, sales, countedCash) });
  });
}
export async function setupPin(pin: string) {
  const credential = await createPin(pin);
  await db.transaction("rw", db.settings, async () => {
    const settings = (await db.settings.get("store")) ?? defaults;
    if (settings.pin) throw new Error("PIN sudah dibuat. Silakan masuk.");
    await db.settings.put({ ...settings, id: "store", pin: credential, pinLock: { ...emptyAttempts } });
  });
}
export async function attemptUnlock(pin: string) {
  const result = await db.transaction("rw", db.settings, async () => {
    const settings = await db.settings.get("store");
    if (!settings?.pin) return "PIN belum dibuat.";
    const state = settings.pinLock ?? emptyAttempts;
    if (cooldownSeconds(state)) return `Terlalu banyak percobaan. Tunggu ${cooldownSeconds(state)} detik.`;
    const correct = await Dexie.waitFor(verifyPin(pin, settings.pin));
    const attempts = nextPinAttempt(state, correct);
    await db.settings.update("store", { pinLock: attempts });
    return correct ? "" : cooldownSeconds(attempts) ? "Lima kali PIN salah. Tunggu 30 detik." : "PIN salah. Silakan coba lagi.";
  });
  if (result) throw new Error(result);
}
export async function changePin(current: string, next: string) {
  const credential = await createPin(next);
  await attemptUnlock(current);
  await db.settings.update("store", { pin: credential, pinLock: { ...emptyAttempts } });
}
export async function resetAllData() {
  await db.transaction("rw", db.tables, () => Promise.all(db.tables.map(t => t.clear())));
}
export async function getBackup(): Promise<Backup> {
  const snapshot = await db.transaction("r", db.tables, async () => ({
    version: 1,
    products: await db.products.toArray(),
    categories: await db.categories.toArray(),
    sales: await db.sales.toArray(),
    shifts: await db.shifts.toArray(),
    settings: (await db.settings.get("store")) ?? defaults,
  }));
  return {
    ...snapshot,
    version: 1,
    settings: {
      ...withoutPin(snapshot.settings),
      qris: snapshot.settings.qris
        ? await photoDataURL(snapshot.settings.qris)
        : undefined,
    },
    products: await Promise.all(
      snapshot.products.map(async ({ photo, ...p }) => ({
        ...p,
        ...(photo ? { photo: await photoDataURL(photo) } : {}),
      })),
    ),
  };
}
export async function replaceData(b: Backup) {
  await db.transaction("rw", db.tables, async () => {
    const current = await db.settings.get("store");
    await Promise.all(db.tables.map((t) => t.clear()));
    await db.products.bulkPut(
      b.products.map(({ photo, ...p }) => ({
        ...p,
        ...(photo ? { photo: photoBlob(photo) } : {}),
      })),
    );
    await db.categories.bulkPut(b.categories);
    await db.sales.bulkPut(b.sales);
    await db.shifts.bulkPut(b.shifts ?? []);
    const { qris, ...settings } = withoutPin(b.settings);
    await db.settings.put({
      ...migrateSettings(settings),
      ...(qris ? { qris: photoBlob(qris) } : {}),
      id: "store",
      pin: current?.pin,
      pinLock: current?.pinLock,
    });
  });
}
export async function saveSale(sale: Sale) {
  await db.transaction("rw", db.products, db.sales, db.shifts, async () => {
    const shift = sale.shiftId ? await db.shifts.get(sale.shiftId) : undefined;
    if (!shift || shift.status !== "open") throw new Error("Buka shift sebelum menyimpan transaksi.");
    const items = [];
    for (const i of sale.items) {
      const p = await db.products.get(i.productId);
      if (!p || !p.active) throw new Error("Produk tidak tersedia.");
      if (p.stock !== null) {
        if (p.stock < i.qty) throw new Error(`Stok ${p.name} tidak cukup.`);
        await db.products.update(p.id, { stock: p.stock - i.qty });
      }
      items.push({ ...i, stockDeducted: p.stock !== null });
    }
    await db.sales.add({ ...sale, items });
  });
}
export async function voidSale(id: string) {
  await db.transaction("rw", db.products, db.sales, async () => {
    const s = await db.sales.get(id);
    if (!s || s.voided) return;
    for (const i of s.items) {
      const p = await db.products.get(i.productId);
      if (p && i.stockDeducted && p.stock !== null)
        await db.products.update(p.id, { stock: stockAfterVoid(p.stock, i) });
    }
    await db.sales.update(id, { voided: true });
  });
}
export async function seed() {
  const categories = [
    { id: "kopi", name: "Kopi" },
    { id: "minuman", name: "Non-kopi" },
    { id: "makanan", name: "Makanan" },
    { id: "camilan", name: "Camilan" },
  ];
  const products: Omit<Product, "photo">[] = [
    ["Es Kopi Susu", "kopi", 18000, "🧋"],
    ["Americano", "kopi", 15000, "☕"],
    ["Cappuccino", "kopi", 22000, "☕"],
    ["Matcha Latte", "minuman", 24000, "🍵"],
    ["Es Cokelat", "minuman", 20000, "🥤"],
    ["Nasi Goreng", "makanan", 28000, "🍛"],
    ["Roti Bakar", "camilan", 16000, "🍞"],
    ["Kentang Goreng", "camilan", 18000, "🍟"],
  ].map((p, i) => ({
    id: `p${i}`,
    name: String(p[0]),
    category: String(p[1]),
    price: Number(p[2]),
    emoji: String(p[3]),
    stock: 100,
    active: true,
    description: `${p[0]} favorit, disiapkan segar untuk menemani hari Anda.`,
    optionGroups: i < 5 ? [
      { name: "Ukuran", required: true, multiple: false, options: [{ name: "Regular", priceDelta: 0 }, { name: "Large", priceDelta: 5000 }] },
      { name: "Gula", required: true, multiple: false, options: [{ name: "Normal", priceDelta: 0 }, { name: "Sedikit", priceDelta: 0 }, { name: "Tanpa gula", priceDelta: 0 }] },
      { name: "Topping", required: false, multiple: true, options: [{ name: "Boba", priceDelta: 3000 }, { name: "Jelly", priceDelta: 2000 }] },
    ] : [],
  }));
  const sales: Sale[] = [];
  const shifts: Shift[] = [];
  for (let d = 29; d >= 0; d--)
  {
    const opened = new Date();
    opened.setDate(opened.getDate() - d);
    opened.setHours(7, 0, 0, 0);
    const shift: Shift = { id: crypto.randomUUID(), openedAt: opened.toISOString(), openingCash: 100000, cashierName: "Kasir contoh", status: "closed" };
    for (let n = 0; n < 6 + Math.floor(Math.random() * 10); n++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(8 + (n % 12), n * 3, 0, 0);
      const p = products[Math.floor(Math.random() * products.length)];
      const items = [
        {
          ...optionLine(p, p.optionGroups?.map(g => g.required ? [0] : [])),
          qty: 1 + Math.floor(Math.random() * 3),
        },
      ];
      const sum = totals(items, 0, 0);
      sales.push({
        id: crypto.randomUUID(),
        date: date.toISOString(),
        items,
        ...sum,
        method: ["Tunai", "QRIS", "Transfer"][n % 3],
        cash: sum.total,
        voided: false,
        customerName: `Pembeli contoh ${n + 1}`,
        taxEnabled: false,
        shiftId: shift.id,
      });
    }
    const closed = new Date(opened);
    closed.setHours(23, 0, 0, 0);
    const expected = summarizeShift(shift, sales, 0).expectedCash;
    shifts.push({ ...shift, closedAt: closed.toISOString(), summary: summarizeShift(shift, sales, expected), note: "Data contoh" });
  }
  await replaceData({
    version: 1,
    products,
    categories,
    sales,
    shifts,
    settings: { ...defaults, qris: undefined },
  });
}
