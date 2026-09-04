import type { Category, IconKey, OpeningBalances, WalletId } from "./types";

export const STORAGE_KEY = "daftary_store_v2";
export const UNLOCK_KEY = "daftary_unlocked_session";
export const NOTIFY_KEY = "daftary_notify_day";

export const MONTH_NAMES_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const WEEKDAYS_AR = ["أحد", "اتنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

export const WALLETS: { id: WalletId; label: string; hint: string }[] = [
  { id: "cash", label: "كاش", hint: "جيبي" },
  { id: "vf_cash", label: "فودافون كاش", hint: "محفظة" },
  { id: "instapay", label: "إنستاباي", hint: "تحويل فوري" },
  { id: "bank", label: "حساب بنكي", hint: "كارت / حساب" },
];

export const EMPTY_WALLETS: OpeningBalances = {
  cash: 0,
  vf_cash: 0,
  instapay: 0,
  bank: 0,
};

export const ICON_OPTIONS: { id: IconKey; label: string }[] = [
  { id: "utensils", label: "أكل" },
  { id: "car", label: "مواصلات" },
  { id: "zap", label: "فواتير" },
  { id: "bag", label: "تسوق" },
  { id: "heart", label: "صحة" },
  { id: "clapper", label: "ترفيه" },
  { id: "book", label: "تعليم" },
  { id: "package", label: "أخرى" },
  { id: "banknote", label: "دخل" },
  { id: "phone", label: "موبايل" },
  { id: "home", label: "بيت" },
  { id: "users", label: "ناس" },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", label: "أكل ومطاعم", icon: "utensils", tone: "food", builtin: true },
  { id: "transport", label: "مواصلات", icon: "car", tone: "transport", builtin: true },
  { id: "bills", label: "فواتير", icon: "zap", tone: "bills", builtin: true },
  { id: "shopping", label: "تسوق", icon: "bag", tone: "shopping", builtin: true },
  { id: "health", label: "صحة", icon: "heart", tone: "health", builtin: true },
  { id: "fun", label: "ترفيه", icon: "clapper", tone: "fun", builtin: true },
  { id: "education", label: "تعليم", icon: "book", tone: "education", builtin: true },
  { id: "salary", label: "راتب وتحويلات", icon: "banknote", tone: "income", builtin: true },
  { id: "savings", label: "ادخار", icon: "banknote", tone: "savings", builtin: true },
  { id: "other", label: "أخرى", icon: "package", tone: "other", builtin: true },
];

export const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];
