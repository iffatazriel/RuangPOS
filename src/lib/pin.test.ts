import { expect, it } from "vitest";
import { validateBackup, withoutPin } from "./logic";
import {
  createPin,
  verifyPin,
  cooldownSeconds,
  nextPinAttempt,
  emptyAttempts,
  shouldSubmitPinOnEnter,
} from "./pin";
it("leaves Enter activation native on buttons and links but submits from non-controls", () => {
  for (const tag of ["BUTTON", "button", "A", "a"])
    expect(shouldSubmitPinOnEnter(tag)).toBe(false);
  for (const tag of [undefined, null, "BODY", "DIV", "SPAN"])
    expect(shouldSubmitPinOnEnter(tag)).toBe(true);
});
it("hashes six-digit PINs with random salts and verifies without plaintext storage", async () => {
  const first = await createPin("123456"),
    second = await createPin("123456");
  expect(first.hash).toHaveLength(64);
  expect(first.salt).toHaveLength(32);
  expect(first).not.toEqual(second);
  expect(Object.keys(first)).toEqual(["salt", "hash"]);
  expect(await verifyPin("123456", first)).toBe(true);
  expect(await verifyPin("654321", first)).toBe(false);
  expect(await verifyPin("", first)).toBe(false);
  expect(await verifyPin("123456", { salt: "bad", hash: "bad" })).toBe(false);
  for (const pin of ["", "12345", "1234567", "abcdef"])
    await expect(createPin(pin)).rejects.toThrow("6 angka");
});
it("blocks after five errors for 30 seconds, then allows a fresh attempt", () => {
  let state = { ...emptyAttempts };
  for (let i = 0; i < 4; i++) state = nextPinAttempt(state, false, 1000);
  expect(state).toEqual({ failures: 4, blockedUntil: 0 });
  state = nextPinAttempt(state, false, 1000);
  expect(cooldownSeconds(state, 1000)).toBe(30);
  expect(nextPinAttempt(state, true, 2000)).toBe(state);
  expect(cooldownSeconds(state, 30999)).toBe(1);
  expect(cooldownSeconds(state, 31000)).toBe(0);
  expect(nextPinAttempt(state, false, 31000)).toEqual({
    failures: 1,
    blockedUntil: 0,
  });
  expect(nextPinAttempt({ failures: 4, blockedUntil: 0 }, true, 31000)).toEqual(
    emptyAttempts,
  );
});
it("removes credentials and lock counters from portable settings, including imported fields", () => {
  const settings = {
    name: "Warung", address: "", phone: "", footer: "",
    taxEnabled: false, bankAccounts: [],
    pin: { salt: "private-salt", hash: "private-hash" },
    pinLock: { failures: 4, blockedUntil: 123 },
  };
  expect(withoutPin(settings)).not.toHaveProperty("pin");
  expect(withoutPin(settings)).not.toHaveProperty("pinLock");
  expect(settings.pin.hash).toBe("private-hash");
  const backup = validateBackup({ version: 1, settings, products: [], categories: [], sales: [] });
  expect(backup.settings).toEqual(withoutPin(settings));
  expect(JSON.stringify(backup)).not.toContain("private-hash");
});
