import type { PinRecord } from "./types";

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function hashSha256(pin: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return toHex(buf);
}

async function hashPbkdf2(pin: string, salt: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(salt),
      iterations: 80_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return toHex(bits);
}

export async function hashPin(pin: string, salt: string, algo: PinRecord["algo"] = "pbkdf2") {
  if (algo === "sha256") return hashSha256(pin, salt);
  return hashPbkdf2(pin, salt);
}

export async function makePin(pin: string): Promise<PinRecord> {
  const salt = randomSalt();
  const hash = await hashPbkdf2(pin, salt);
  return { salt, hash, algo: "pbkdf2" };
}

export async function verifyPin(pin: string, record: PinRecord) {
  const algo = record.algo ?? "sha256";
  const hash = await hashPin(pin, record.salt, algo);
  return hash === record.hash;
}
