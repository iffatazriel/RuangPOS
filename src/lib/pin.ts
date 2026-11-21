export interface PinCredential {
  salt: string;
  hash: string;
}
export interface PinAttempts {
  failures: number;
  blockedUntil: number;
}
export const emptyAttempts: PinAttempts = { failures: 0, blockedUntil: 0 };
export const LOCK_AFTER_MS = 15 * 60 * 1000;
export function shouldSubmitPinOnEnter(tagName?: string | null) {
  return !["BUTTON", "A"].includes(tagName?.toUpperCase() ?? "");
}
const hex = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
async function digest(pin: string, salt: string) {
  return hex(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(`${salt}:${pin}`),
      ),
    ),
  );
}
export async function createPin(pin: string): Promise<PinCredential> {
  if (!/^\d{6}$/.test(pin)) throw new Error("PIN harus terdiri dari 6 angka.");
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await digest(pin, salt) };
}
export async function verifyPin(pin: string, credential: PinCredential) {
  if (
    !/^\d{6}$/.test(pin) ||
    !/^[a-f0-9]{32}$/.test(credential.salt) ||
    !/^[a-f0-9]{64}$/.test(credential.hash)
  )
    return false;
  const hash = await digest(pin, credential.salt);
  let difference = 0;
  for (let i = 0; i < hash.length; i++)
    difference |= hash.charCodeAt(i) ^ credential.hash.charCodeAt(i);
  return difference === 0;
}
export function cooldownSeconds(attempts: PinAttempts, now = Date.now()) {
  return Math.max(0, Math.ceil((attempts.blockedUntil - now) / 1000));
}
export function nextPinAttempt(
  attempts: PinAttempts,
  correct: boolean,
  now = Date.now(),
): PinAttempts {
  if (cooldownSeconds(attempts, now)) return attempts;
  if (correct) return { ...emptyAttempts };
  const failures = attempts.failures + 1;
  return failures >= 5
    ? { failures: 0, blockedUntil: now + 30_000 }
    : { failures, blockedUntil: 0 };
}
