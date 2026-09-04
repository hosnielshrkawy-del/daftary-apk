import { DEFAULT_CATEGORIES, STORAGE_KEY } from "./constants";
import { applyRecurring, emptyWallets, ensureCategories } from "./ledger";
import type { DaftaryData, OpeningBalances } from "./types";

export function emptyData(): DaftaryData {
  return {
    version: 3,
    theme: "light",
    pin: null,
    onboarded: false,
    openingBalances: emptyWallets(),
    transactions: [],
    budgets: {},
    categoryBudgets: {},
    recurring: [],
    goals: [],
    people: [],
    categories: DEFAULT_CATEGORIES,
    jam3eyat: [],
    notifyEnabled: false,
  };
}

function asOpening(raw: unknown): OpeningBalances {
  const base = emptyWallets();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  for (const k of Object.keys(base) as (keyof OpeningBalances)[]) {
    const n = Number(o[k]);
    if (Number.isFinite(n)) base[k] = n;
  }
  return base;
}

export function normalize(parsed: Partial<DaftaryData> & { version?: number }): DaftaryData {
  const base = emptyData();
  const hasLife = Boolean(
    (parsed.transactions && parsed.transactions.length > 0) ||
      parsed.pin ||
      (parsed.goals && parsed.goals.length > 0) ||
      (parsed.people && parsed.people.length > 0),
  );
  return {
    ...base,
    ...parsed,
    version: 3,
    theme: parsed.theme === "dark" ? "dark" : "light",
    pin: parsed.pin ?? null,
    onboarded: parsed.onboarded ?? hasLife,
    openingBalances: asOpening(parsed.openingBalances),
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    budgets: parsed.budgets && typeof parsed.budgets === "object" ? parsed.budgets : {},
    categoryBudgets:
      parsed.categoryBudgets && typeof parsed.categoryBudgets === "object"
        ? parsed.categoryBudgets
        : {},
    recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    people: Array.isArray(parsed.people) ? parsed.people : [],
    categories: ensureCategories(parsed.categories),
    jam3eyat: Array.isArray(parsed.jam3eyat) ? parsed.jam3eyat : [],
    notifyEnabled: Boolean(parsed.notifyEnabled),
  };
}

export function loadData(): DaftaryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return normalize(JSON.parse(raw) as Partial<DaftaryData>);
  } catch {
    return emptyData();
  }
}

export function saveData(data: DaftaryData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function toBackupJson(data: DaftaryData) {
  const payload: DaftaryData = {
    ...data,
    exportedAt: new Date().toISOString(),
    pin: null,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackup(raw: string): DaftaryData {
  const parsed = JSON.parse(raw) as Partial<DaftaryData>;
  if (!parsed || typeof parsed !== "object") throw new Error("ملف غير صالح");
  return normalize({ ...parsed, pin: null });
}

export { applyRecurring };
