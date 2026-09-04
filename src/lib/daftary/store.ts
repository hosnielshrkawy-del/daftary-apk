import { create } from "zustand";
import { DEFAULT_CATEGORIES, UNLOCK_KEY } from "./constants";
import { currentMonthKey, monthKeyFromIso, todayIso } from "./format";
import { pingReminders } from "./notify";
import { makePin, verifyPin } from "./pin";
import { applyRecurring, reverseSideEffects } from "./ledger";
import { emptyData, loadData, parseBackup, saveData } from "./storage";
import { buildDemoData } from "./seed";
import type {
  Category,
  DaftaryData,
  Goal,
  Jam3eya,
  MorePanel,
  OpeningBalances,
  PersonEntry,
  Recurring,
  Theme,
  Transaction,
  TxDraft,
  ViewId,
  WalletId,
} from "./types";

function persist(data: DaftaryData) {
  saveData(data);
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

interface Store extends DaftaryData {
  hydrated: boolean;
  unlocked: boolean;
  view: ViewId;
  morePanel: MorePanel;
  draft: TxDraft | null;
  lastDeleted: Transaction | null;
  hydrate: () => void;
  setView: (v: ViewId) => void;
  setMorePanel: (p: MorePanel) => void;
  setDraft: (d: TxDraft | null) => void;
  toggleTheme: () => void;
  completeOnboarding: (opening: OpeningBalances, budget?: number) => void;
  setOpeningBalances: (opening: OpeningBalances) => void;
  addTx: (t: Omit<Transaction, "id">) => string;
  updateTx: (id: string, patch: Partial<Transaction>) => void;
  deleteTx: (id: string) => void;
  undoDelete: () => void;
  setBudget: (monthKey: string, amount: number) => void;
  setCategoryBudget: (monthKey: string, catId: string, amount: number) => void;
  addRecurring: (r: Omit<Recurring, "id">) => string;
  deleteRecurring: (id: string) => void;
  addGoal: (name: string, target: number) => void;
  contributeGoal: (id: string, amount: number, wallet: WalletId) => void;
  deleteGoal: (id: string) => void;
  addPerson: (p: Omit<PersonEntry, "id" | "settled">) => void;
  settlePerson: (id: string, wallet: WalletId) => void;
  deletePerson: (id: string) => void;
  addCategory: (c: Omit<Category, "id" | "builtin">) => void;
  deleteCategory: (id: string) => void;
  addJam3eya: (j: Omit<Jam3eya, "id" | "paidMonths" | "received">) => void;
  payJam3eya: (id: string) => void;
  receiveJam3eya: (id: string) => void;
  deleteJam3eya: (id: string) => void;
  setNotifyEnabled: (on: boolean) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => void;
  unlock: (pin: string) => Promise<boolean>;
  loadDemo: () => void;
  wipeAll: () => void;
  replaceAll: (data: DaftaryData) => void;
  mergeAll: (data: DaftaryData) => void;
  importRaw: (raw: string, mode: "replace" | "merge") => void;
}

export const useDaftary = create<Store>((set, get) => ({
  ...emptyData(),
  hydrated: false,
  unlocked: true,
  view: "home",
  morePanel: "menu",
  draft: null,
  lastDeleted: null,

  hydrate: () => {
    let data = loadData();
    data = applyRecurring(data, currentMonthKey());
    persist(data);
    applyTheme(data.theme);
    const needsLock = Boolean(data.pin);
    const sessionOk = sessionStorage.getItem(UNLOCK_KEY) === "1";
    set({
      ...data,
      hydrated: true,
      unlocked: !needsLock || sessionOk,
      lastDeleted: null,
    });
    if (!needsLock || sessionOk) pingReminders(data);
  },

  setView: (view) => set({ view, morePanel: view === "more" ? get().morePanel : "menu" }),
  setMorePanel: (morePanel) => set({ morePanel }),
  setDraft: (draft) => set({ draft }),

  toggleTheme: () => {
    const theme: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    const next = { ...sliceData(get()), theme };
    persist(next);
    set({ theme });
  },

  completeOnboarding: (opening, budget) => {
    const mk = currentMonthKey();
    const budgets = { ...get().budgets };
    if (budget && budget > 0) budgets[mk] = budget;
    const next = { ...sliceData(get()), openingBalances: opening, budgets, onboarded: true };
    persist(next);
    set({ openingBalances: opening, budgets, onboarded: true, view: "home" });
  },

  setOpeningBalances: (openingBalances) => {
    const next = { ...sliceData(get()), openingBalances };
    persist(next);
    set({ openingBalances });
  },

  addTx: (t) => {
    const tx: Transaction = { ...t, id: crypto.randomUUID() };
    const transactions = [tx, ...get().transactions];
    const next = { ...sliceData(get()), transactions };
    persist(next);
    set({ transactions, lastDeleted: null });
    return tx.id;
  },

  updateTx: (id, patch) => {
    const transactions = get().transactions.map((t) => (t.id === id ? { ...t, ...patch, id } : t));
    const next = { ...sliceData(get()), transactions };
    persist(next);
    set({ transactions });
  },

  deleteTx: (id) => {
    const tx = get().transactions.find((t) => t.id === id);
    if (!tx) return;
    const transactions = get().transactions.filter((t) => t.id !== id);
    let next = { ...sliceData(get()), transactions };
    next = reverseSideEffects(next, tx);
    persist(next);
    set({ ...next, lastDeleted: tx });
  },

  undoDelete: () => {
    const tx = get().lastDeleted;
    if (!tx) return;
    const transactions = [tx, ...get().transactions.filter((t) => t.id !== tx.id)];
    const next = { ...sliceData(get()), transactions };
    persist(next);
    set({ transactions, lastDeleted: null });
  },

  setBudget: (monthKey, amount) => {
    const budgets = { ...get().budgets, [monthKey]: amount };
    const next = { ...sliceData(get()), budgets };
    persist(next);
    set({ budgets });
  },

  setCategoryBudget: (monthKey, catId, amount) => {
    const month = { ...(get().categoryBudgets[monthKey] ?? {}) };
    if (amount <= 0) delete month[catId];
    else month[catId] = amount;
    const categoryBudgets = { ...get().categoryBudgets, [monthKey]: month };
    const next = { ...sliceData(get()), categoryBudgets };
    persist(next);
    set({ categoryBudgets });
  },

  addRecurring: (r) => {
    const item: Recurring = { ...r, id: crypto.randomUUID() };
    const recurring = [...get().recurring, item];
    const next = { ...sliceData(get()), recurring };
    persist(next);
    set({ recurring });
    return item.id;
  },

  deleteRecurring: (id) => {
    const recurring = get().recurring.filter((r) => r.id !== id);
    const next = { ...sliceData(get()), recurring };
    persist(next);
    set({ recurring });
  },

  addGoal: (name, target) => {
    const goals: Goal[] = [...get().goals, { id: crypto.randomUUID(), name, target, saved: 0 }];
    const next = { ...sliceData(get()), goals };
    persist(next);
    set({ goals });
  },

  contributeGoal: (id, amount, wallet) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;
    const goals = get().goals.map((g) => (g.id === id ? { ...g, saved: g.saved + amount } : g));
    const tx: Transaction = {
      id: crypto.randomUUID(),
      amount,
      desc: `ادخار: ${goal.name}`,
      category: "savings",
      date: todayIso(),
      type: "expense",
      wallet,
      goalId: id,
    };
    const transactions = [tx, ...get().transactions];
    const next = { ...sliceData(get()), goals, transactions };
    persist(next);
    set({ goals, transactions });
  },

  deleteGoal: (id) => {
    const goals = get().goals.filter((g) => g.id !== id);
    const next = { ...sliceData(get()), goals };
    persist(next);
    set({ goals });
  },

  addPerson: (p) => {
    const people = [...get().people, { ...p, id: crypto.randomUUID(), settled: false }];
    const next = { ...sliceData(get()), people };
    persist(next);
    set({ people });
  },

  settlePerson: (id, wallet) => {
    const person = get().people.find((p) => p.id === id);
    if (!person || person.settled) return;
    const txId = crypto.randomUUID();
    const lent = person.direction === "lent";
    const tx: Transaction = {
      id: txId,
      amount: person.amount,
      desc: lent ? `سداد من ${person.name}` : `سددت لـ ${person.name}`,
      category: lent ? "salary" : "other",
      date: todayIso(),
      type: lent ? "income" : "expense",
      wallet,
      personId: id,
    };
    const people = get().people.map((p) =>
      p.id === id ? { ...p, settled: true, settleTxId: txId, wallet } : p,
    );
    const transactions = [tx, ...get().transactions];
    const next = { ...sliceData(get()), people, transactions };
    persist(next);
    set({ people, transactions });
  },

  deletePerson: (id) => {
    const people = get().people.filter((p) => p.id !== id);
    const next = { ...sliceData(get()), people };
    persist(next);
    set({ people });
  },

  addCategory: (c) => {
    const categories = [
      ...get().categories.filter((x) => x.id !== "other"),
      { ...c, id: `c_${crypto.randomUUID().slice(0, 8)}`, builtin: false },
      get().categories.find((x) => x.id === "other") ?? {
        id: "other",
        label: "أخرى",
        icon: "package" as const,
        tone: "other" as const,
        builtin: true,
      },
    ];
    const next = { ...sliceData(get()), categories };
    persist(next);
    set({ categories });
  },

  deleteCategory: (id) => {
    const cat = get().categories.find((c) => c.id === id);
    if (!cat || cat.builtin) return;
    const categories = get().categories.filter((c) => c.id !== id);
    const transactions = get().transactions.map((t) =>
      t.category === id ? { ...t, category: "other" } : t,
    );
    const next = { ...sliceData(get()), categories, transactions };
    persist(next);
    set({ categories, transactions });
  },

  addJam3eya: (j) => {
    const item: Jam3eya = { ...j, id: crypto.randomUUID(), paidMonths: [], received: false };
    const jam3eyat = [...get().jam3eyat, item];
    const next = { ...sliceData(get()), jam3eyat };
    persist(next);
    set({ jam3eyat });
  },

  payJam3eya: (id) => {
    const j = get().jam3eyat.find((x) => x.id === id);
    if (!j) return;
    const mk = currentMonthKey();
    if (j.paidMonths.includes(mk)) return;
    const tx: Transaction = {
      id: crypto.randomUUID(),
      amount: j.monthly,
      desc: `قسط جمعية ${j.name}`,
      category: "savings",
      date: todayIso(),
      type: "expense",
      wallet: j.wallet,
      jam3eyaId: id,
    };
    const jam3eyat = get().jam3eyat.map((x) =>
      x.id === id ? { ...x, paidMonths: [...x.paidMonths, mk] } : x,
    );
    const transactions = [tx, ...get().transactions];
    const next = { ...sliceData(get()), jam3eyat, transactions };
    persist(next);
    set({ jam3eyat, transactions });
  },

  receiveJam3eya: (id) => {
    const j = get().jam3eyat.find((x) => x.id === id);
    if (!j || j.received) return;
    const pot = j.monthly * j.members;
    const tx: Transaction = {
      id: crypto.randomUUID(),
      amount: pot,
      desc: `وش جمعية ${j.name}`,
      category: "salary",
      date: todayIso(),
      type: "income",
      wallet: j.wallet,
      jam3eyaId: id,
    };
    const jam3eyat = get().jam3eyat.map((x) => (x.id === id ? { ...x, received: true } : x));
    const transactions = [tx, ...get().transactions];
    const next = { ...sliceData(get()), jam3eyat, transactions };
    persist(next);
    set({ jam3eyat, transactions });
  },

  deleteJam3eya: (id) => {
    const jam3eyat = get().jam3eyat.filter((j) => j.id !== id);
    const next = { ...sliceData(get()), jam3eyat };
    persist(next);
    set({ jam3eyat });
  },

  setNotifyEnabled: async (on) => {
    const next = { ...sliceData(get()), notifyEnabled: on };
    persist(next);
    set({ notifyEnabled: on });
    if (on) pingReminders(next);
  },

  setPin: async (pin) => {
    const record = await makePin(pin);
    const next = { ...sliceData(get()), pin: record };
    persist(next);
    sessionStorage.setItem(UNLOCK_KEY, "1");
    set({ pin: record, unlocked: true });
  },

  clearPin: () => {
    const next = { ...sliceData(get()), pin: null };
    persist(next);
    sessionStorage.removeItem(UNLOCK_KEY);
    set({ pin: null, unlocked: true });
  },

  unlock: async (pin) => {
    const record = get().pin;
    if (!record) {
      set({ unlocked: true });
      return true;
    }
    const ok = await verifyPin(pin, record);
    if (ok) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      set({ unlocked: true });
      pingReminders(sliceData(get()));
    }
    return ok;
  },

  loadDemo: () => {
    const data = buildDemoData();
    data.theme = get().theme;
    persist(data);
    applyTheme(data.theme);
    set({ ...data, view: "home", morePanel: "menu", lastDeleted: null });
  },

  wipeAll: () => {
    const data = emptyData();
    data.theme = get().theme;
    data.onboarded = true;
    persist(data);
    set({ ...data, view: "home", morePanel: "menu", lastDeleted: null });
  },

  replaceAll: (incoming) => {
    const data: DaftaryData = {
      ...incoming,
      version: 3,
      pin: get().pin,
      theme: incoming.theme ?? get().theme,
      categories:
        incoming.categories && incoming.categories.length > 0
          ? incoming.categories
          : DEFAULT_CATEGORIES,
      onboarded: true,
    };
    persist(data);
    applyTheme(data.theme);
    set({ ...data });
  },

  mergeAll: (incoming) => {
    const cur = sliceData(get());
    const ids = {
      tx: new Set(cur.transactions.map((t) => t.id)),
      goals: new Set(cur.goals.map((g) => g.id)),
      people: new Set(cur.people.map((p) => p.id)),
      rec: new Set(cur.recurring.map((r) => r.id)),
      cat: new Set(cur.categories.map((c) => c.id)),
      jam: new Set(cur.jam3eyat.map((j) => j.id)),
    };
    const data: DaftaryData = {
      ...cur,
      transactions: [
        ...incoming.transactions.filter((t) => !ids.tx.has(t.id)),
        ...cur.transactions,
      ],
      goals: [...cur.goals, ...incoming.goals.filter((g) => !ids.goals.has(g.id))],
      people: [...cur.people, ...incoming.people.filter((p) => !ids.people.has(p.id))],
      recurring: [...cur.recurring, ...incoming.recurring.filter((r) => !ids.rec.has(r.id))],
      jam3eyat: [...cur.jam3eyat, ...(incoming.jam3eyat ?? []).filter((j) => !ids.jam.has(j.id))],
      categories: [
        ...cur.categories,
        ...incoming.categories.filter((c) => !ids.cat.has(c.id) && !c.builtin),
      ],
      budgets: { ...incoming.budgets, ...cur.budgets },
      categoryBudgets: { ...incoming.categoryBudgets, ...cur.categoryBudgets },
      openingBalances: cur.openingBalances,
      onboarded: true,
    };
    persist(data);
    set({ ...data });
  },

  importRaw: (raw, mode) => {
    const incoming = parseBackup(raw);
    if (mode === "replace") get().replaceAll(incoming);
    else get().mergeAll(incoming);
  },
}));

function sliceData(s: DaftaryData): DaftaryData {
  return {
    version: 3,
    theme: s.theme,
    pin: s.pin,
    onboarded: s.onboarded,
    openingBalances: s.openingBalances,
    transactions: s.transactions,
    budgets: s.budgets,
    categoryBudgets: s.categoryBudgets,
    recurring: s.recurring,
    goals: s.goals,
    people: s.people,
    categories: s.categories,
    jam3eyat: s.jam3eyat,
    notifyEnabled: s.notifyEnabled,
  };
}

export function catInfo(categories: Category[], id: string) {
  return (
    categories.find((c) => c.id === id) ??
    categories[categories.length - 1] ??
    DEFAULT_CATEGORIES.at(-1)!
  );
}

export function monthKeyOf(iso: string) {
  return monthKeyFromIso(iso);
}
