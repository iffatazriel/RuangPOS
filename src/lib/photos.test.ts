import { expect, it } from "vitest";
import { validPhoto, validateBackup } from "./logic";
import { photoBlob } from "./photos";
import { defaults } from "./db";
const photo = "data:image/jpeg;base64,/9j/2Q==";
const product = { id: "p", name: "Kopi", category: "", price: 1000, stock: null, emoji: "☕", active: true, description: "Kopi segar", photo };
it("accepts portable photos and restores their Blob bytes", async () => {
  const backup = { version: 1, products: [product], categories: [], sales: [], settings: defaults };
  expect(validateBackup(backup)).toEqual(backup);
  expect(photoBlob(photo).type).toBe("image/jpeg");
  expect([...new Uint8Array(await photoBlob(photo).arrayBuffer())]).toEqual([255,216,255,217]);
  expect(validPhoto("data:image/webp;base64," + btoa("RIFF0000WEBP"))).toBe(true);
});
it("allows legacy products without description or photo", () => {
  const { photo: _photo, description: _description, ...legacy } = product;
  void _photo; void _description;
  expect(validateBackup({ version: 1, products: [legacy], categories: [], sales: [], settings: defaults }).products).toEqual([legacy]);
});
it("rejects non-image, malformed and oversized photo backups", () => {
  for (const photo of [null, {}, "data:text/html;base64,PHNjcmlwdD4=", "data:image/jpeg;base64,YWJj", "data:image/webp;base64,@@@@", "data:image/jpeg;base64," + "A".repeat(4_000_000)]) {
    expect(validPhoto(photo)).toBe(false);
    expect(() => validateBackup({ version: 1, products: [{ ...product, photo }], categories: [], sales: [], settings: defaults })).toThrow("Produk tidak valid.");
  }
});
