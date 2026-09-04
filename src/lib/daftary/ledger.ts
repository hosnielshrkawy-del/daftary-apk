import { DEFAULT_CATEGORIES, EMPTY_WALLETS, WALLETS } from "./constants";
import { currentMonthKey, daysLeftInMonth, money, monthKeyFromIso, walletLabel } from "./format";
import type {
  Category,
  DaftaryData,
  OpeningBalances,
  Transaction,
  WalletId,
} from "./types";

export function emptyWallets(): OpeningBalances {
  return { ...EMPTY_WALLETS };
}

export function walletBalances(data: Pick<DaftaryData, "openingBalances" | "transactions">) {
  const bal: OpeningBalances = { ...emptyWallets(), ...data.openingBalances };
  for (const t of data.transactions) {
    if (t.type === "expense") bal[t.wallet] -= t.amount;
    else if (t.type === "income") bal[t.wallet] += t.amount;
    else if (t.type === "transfer") {
      bal[t.wallet] -= t.amount;
      if (t.walletTo) bal[t.walletTo] += t.amount;
    }
  }
  return bal;
}

export function netWorth(bal: OpeningBalances) {
  return WALLETS.reduce((s, w) => s + (bal[w.id] || 0), 0);
}

export function monthSpent(list: Transaction[], monthKey: string) {
  return list
    .filter((t) => t.type === "expense" && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);
}

export function monthEarned(list: Transaction[], monthKey: string) {
  return list
    .filter((t) => t.type === "income" && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);
}

export function prevMonthKey(d = new Date()) {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return currentMonthKey(prev);
}

export function spendByCategory(list: Transaction[], monthKey: string) {
  const byCat: Record<string, number> = {};
  list
    .filter((t) => t.type === "expense" && t.date.startsWith(monthKey))
    .forEach((t) => {
      byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    });
  return byCat;
}

export function spendByDay(list: Transaction[], monthKey: string) {
  const map: Record<string, number> = {};
  list
    .filter((t) => t.type === "expense" && t.date.startsWith(monthKey))
    .forEach((t) => {
      map[t.date] = (map[t.date] || 0) + t.amount;
    });
  return map;
}

export function dailyPace(spent: number, budget: number | undefined, now = new Date()) {
  if (!budget || budget <= 0) return null;
  const leftDays = daysLeftInMonth(now);
  const remaining = budget - spent;
  return {
    remaining,
    leftDays,
    perDay: remaining / leftDays,
    over: remaining < 0,
    pct: Math.min(100, Math.round((spent / budget) * 100)),
  };
}

export function searchTransactions(
  list: Transaction[],
  query: string,
  categories: Category[],
) {
  const term = query.trim().toLowerCase();
  if (!term) return list;
  const numeric = Number(term.replace(/[^\d.]/g, ""));
  const hasNum = term.replace(/[^\d.]/g, "").length > 0 && !Number.isNaN(numeric);
  return list.filter((t) => {
    const cat = categories.find((c) => c.id === t.category)?.label ?? "";
    const wallet = walletLabel(t.wallet);
    const hay = `${t.desc} ${cat} ${wallet} ${t.date} ${t.amount}`.toLowerCase();
    if (hay.includes(term)) return true;
    if (hasNum && Math.abs(t.amount - numeric) < 0.001) return true;
    return false;
  });
}

export function frequentDescriptions(list: Transaction[], limit = 6) {
  const counts = new Map<string, number>();
  for (const t of list) {
    const d = t.desc.trim();
    if (d.length < 2) continue;
    counts.set(d, (counts.get(d) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([desc]) => desc);
}

export function applyRecurring(data: DaftaryData, monthKey: string): DaftaryData {
  if (data.recurring.length === 0) return data;
  let changed = false;
  const list = [...data.transactions];
  for (const tpl of data.recurring) {
    const already = list.some((t) => t.recurringId === tpl.id && t.date.startsWith(monthKey));
    if (already) continue;
    const day = Math.min(tpl.dayOfMonth, 28);
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    list.unshift({
      id: crypto.randomUUID(),
      amount: tpl.amount,
      desc: tpl.desc,
      category: tpl.category,
      date,
      type: tpl.type,
      wallet: tpl.wallet,
      recurringId: tpl.id,
    });
    changed = true;
  }
  return changed ? { ...data, transactions: list } : data;
}

export function reverseSideEffects(data: DaftaryData, tx: Transaction): DaftaryData {
  let goals = data.goals;
  let people = data.people;
  let jam3eyat = data.jam3eyat;
  if (tx.goalId) {
    goals = goals.map((g) =>
      g.id === tx.goalId ? { ...g, saved: Math.max(0, g.saved - tx.amount) } : g,
    );
  }
  if (tx.personId) {
    people = people.map((p) =>
      p.id === tx.personId && p.settleTxId === tx.id
        ? { ...p, settled: false, settleTxId: null }
        : p,
    );
  }
  if (tx.jam3eyaId) {
    const mk = monthKeyFromIso(tx.date);
    jam3eyat = jam3eyat.map((j) => {
      if (j.id !== tx.jam3eyaId) return j;
      if (tx.type === "income") return { ...j, received: false };
      return { ...j, paidMonths: j.paidMonths.filter((m) => m !== mk) };
    });
  }
  return { ...data, goals, people, jam3eyat };
}

export function mergeCategories(current: Category[], incoming: Category[]) {
  const ids = new Set(current.map((c) => c.id));
  return [
    ...current,
    ...incoming.filter((c) => !ids.has(c.id) && !c.builtin),
  ];
}

export function ensureCategories(list: Category[] | undefined): Category[] {
  if (!list || list.length === 0) return DEFAULT_CATEGORIES;
  const ids = new Set(list.map((c) => c.id));
  const missing = DEFAULT_CATEGORIES.filter((c) => !ids.has(c.id));
  if (missing.length === 0) return list;
  const withoutOther = list.filter((c) => c.id !== "other");
  const other = list.find((c) => c.id === "other") ?? DEFAULT_CATEGORIES.find((c) => c.id === "other")!;
  return [...withoutOther, ...missing.filter((c) => c.id !== "other"), other];
}

export function monthReportText(data: DaftaryData, monthKey: string, categories: Category[]) {
  const spent = monthSpent(data.transactions, monthKey);
  const earned = monthEarned(data.transactions, monthKey);
  const byCat = spendByCategory(data.transactions, monthKey);
  const top = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a])[0];
  const topLabel = top ? categories.find((c) => c.id === top)?.label : null;
  const budget = data.budgets[monthKey];
  const lines = [
    `دفتري — تقرير ${monthKey}`,
    `صرف: ${money(spent)} ج.م`,
    `دخل: ${money(earned)} ج.م`,
    `صافي: ${money(earned - spent)} ج.م`,
  ];
  if (budget) lines.push(`ميزانية: ${money(budget)} ج.م (${Math.round((spent / budget) * 100)}%)`);
  if (topLabel) lines.push(`أكتر فئة: ${topLabel} (${money(byCat[top])} ج.م)`);
  const open = data.people.filter((p) => !p.settled);
  const they = open.filter((p) => p.direction === "lent").reduce((s, p) => s + p.amount, 0);
  const you = open.filter((p) => p.direction === "owed").reduce((s, p) => s + p.amount, 0);
  if (they || you) lines.push(`سلف: ليك ${money(they)} · عليك ${money(you)}`);
  return lines.join("\n");
}

export const WALLET_IDS = WALLETS.map((w) => w.id) as WalletId[];
