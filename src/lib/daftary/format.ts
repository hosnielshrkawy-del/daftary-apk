import { MONTH_NAMES_AR, WALLETS } from "./constants";
import type { WalletId } from "./types";

export function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function todayIso(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function money(n: number) {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("ar-EG", { maximumFractionDigits: 2 });
  if (n < 0) return `−${formatted}`;
  return formatted;
}

export function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTH_NAMES_AR[d.getMonth()]}`;
}

export function monthLabel(d: Date | string = new Date()) {
  const dt = typeof d === "string" ? new Date(d + (d.length === 7 ? "-01" : "") + "T00:00:00") : d;
  if (Number.isNaN(dt.getTime())) return String(d);
  return `${MONTH_NAMES_AR[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function walletLabel(id: WalletId) {
  return WALLETS.find((w) => w.id === id)?.label ?? id;
}

export function daysInMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function daysLeftInMonth(d = new Date()) {
  return daysInMonth(d) - d.getDate() + 1;
}

export function clampDay(day: number) {
  return Math.min(28, Math.max(1, Math.round(day)));
}

export function monthKeyFromIso(iso: string) {
  return iso.slice(0, 7);
}
