export type TxType = "expense" | "income" | "transfer";
export type WalletId = "cash" | "vf_cash" | "instapay" | "bank";
export type ViewId = "home" | "add" | "history" | "people" | "budget" | "more";
export type MorePanel =
  | "menu"
  | "goals"
  | "categories"
  | "lock"
  | "backup"
  | "jam3eya"
  | "install"
  | "report"
  | "wallets";
export type Theme = "light" | "dark";

export type IconKey =
  | "utensils"
  | "car"
  | "zap"
  | "bag"
  | "heart"
  | "clapper"
  | "book"
  | "package"
  | "banknote"
  | "phone"
  | "home"
  | "users";

export type CatTone =
  | "food"
  | "transport"
  | "bills"
  | "shopping"
  | "health"
  | "fun"
  | "education"
  | "other"
  | "income"
  | "savings";

export interface Category {
  id: string;
  label: string;
  icon: IconKey;
  tone: CatTone;
  builtin: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  desc: string;
  category: string;
  date: string;
  type: TxType;
  wallet: WalletId;
  walletTo?: WalletId | null;
  recurringId?: string | null;
  personId?: string | null;
  goalId?: string | null;
  jam3eyaId?: string | null;
}

export interface Recurring {
  id: string;
  desc: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  type: Exclude<TxType, "transfer">;
  wallet: WalletId;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
}

export interface PersonEntry {
  id: string;
  name: string;
  amount: number;
  direction: "lent" | "owed";
  note: string;
  date: string;
  settled: boolean;
  settleTxId?: string | null;
  wallet?: WalletId;
}

export interface Jam3eya {
  id: string;
  name: string;
  monthly: number;
  members: number;
  payDay: number;
  startMonth: string;
  receiveMonth: string;
  wallet: WalletId;
  paidMonths: string[];
  received: boolean;
}

export interface PinRecord {
  salt: string;
  hash: string;
  algo?: "sha256" | "pbkdf2";
}

export type OpeningBalances = Record<WalletId, number>;
export type CategoryBudgets = Record<string, Record<string, number>>;

export interface DaftaryData {
  version: 3;
  exportedAt?: string;
  theme: Theme;
  pin: PinRecord | null;
  onboarded: boolean;
  openingBalances: OpeningBalances;
  transactions: Transaction[];
  budgets: Record<string, number>;
  categoryBudgets: CategoryBudgets;
  recurring: Recurring[];
  goals: Goal[];
  people: PersonEntry[];
  categories: Category[];
  jam3eyat: Jam3eya[];
  notifyEnabled: boolean;
}

export interface TxDraft {
  id?: string;
  type?: TxType;
  amount?: string;
  desc?: string;
  category?: string | null;
  date?: string;
  wallet?: WalletId;
  walletTo?: WalletId;
  recurring?: boolean;
}
