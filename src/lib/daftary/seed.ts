import { currentMonthKey, todayIso } from "./format";
import { emptyData } from "./storage";
import type { DaftaryData, Transaction, WalletId } from "./types";

function tx(
  amount: number,
  desc: string,
  category: string,
  date: string,
  type: Transaction["type"] = "expense",
  wallet: WalletId = "cash",
  extra: Partial<Transaction> = {},
): Transaction {
  return {
    id: crypto.randomUUID(),
    amount,
    desc,
    category,
    date,
    type,
    wallet,
    ...extra,
  };
}

export function buildDemoData(): DaftaryData {
  const data = emptyData();
  data.onboarded = true;
  const mk = currentMonthKey();
  const d = (day: number) => `${mk}-${String(day).padStart(2, "0")}`;
  const today = new Date().getDate();
  const cap = Math.max(3, Math.min(today, 28));
  const monthName = new Intl.DateTimeFormat("ar-EG", { month: "long" }).format(new Date());

  data.openingBalances = {
    cash: 420,
    vf_cash: 180,
    instapay: 650,
    bank: 12400,
  };

  data.transactions = [
    tx(8500, `راتب ${monthName}`, "salary", d(1), "income", "bank"),
    tx(3000, "إيجار الشقة", "bills", d(1), "expense", "bank"),
    tx(350, "فاتورة نت WE", "bills", d(2), "expense", "vf_cash"),
    tx(45, "أوبر للشغل", "transport", d(Math.min(3, cap)), "expense", "instapay"),
    tx(28, "فول وطعمية", "food", d(Math.min(3, cap))),
    tx(120, "سوبر ماركت", "shopping", d(Math.min(5, cap))),
    tx(80, "صيدلية — ضغط", "health", d(Math.min(6, cap)), "expense", "vf_cash"),
    tx(55, "أوبر رجوع", "transport", d(Math.min(7, cap)), "expense", "instapay"),
    tx(200, "كشري وأبو طارق مع الشغل", "food", d(Math.min(8, cap))),
    tx(90, "بنزين", "transport", d(Math.min(10, cap))),
    tx(150, "جيم", "fun", d(Math.min(12, cap)), "expense", "instapay"),
    tx(40, "قهوة", "food", d(Math.min(13, cap))),
    tx(600, "هدوم", "shopping", d(Math.min(15, cap)), "expense", "bank"),
    tx(35, "ميكروباص", "transport", d(Math.min(16, cap))),
    tx(75, "دليفري", "food", d(Math.min(cap, cap))),
    tx(200, "تحويل لكاش المصروف", "other", d(Math.min(4, cap)), "transfer", "bank", {
      walletTo: "cash",
    }),
  ].filter((t) => t.date <= todayIso());

  data.budgets[mk] = 5000;
  data.categoryBudgets[mk] = {
    food: 1200,
    transport: 800,
    bills: 3500,
    shopping: 700,
  };
  data.goals = [
    { id: crypto.randomUUID(), name: "لابتوب شغل", target: 18000, saved: 4500 },
    { id: crypto.randomUUID(), name: "رحلة سيناء", target: 6000, saved: 1200 },
  ];
  data.people = [
    {
      id: crypto.randomUUID(),
      name: "أحمد علي",
      amount: 250,
      direction: "lent",
      note: "سلفته من الخروج",
      date: d(Math.min(4, cap)),
      settled: false,
    },
    {
      id: crypto.randomUUID(),
      name: "سارة",
      amount: 400,
      direction: "owed",
      note: "جمعية الشهر",
      date: d(1),
      settled: false,
    },
  ];
  data.recurring = [
    {
      id: crypto.randomUUID(),
      desc: "إيجار الشقة",
      amount: 3000,
      category: "bills",
      dayOfMonth: 1,
      type: "expense",
      wallet: "bank",
    },
  ];
  data.jam3eyat = [
    {
      id: crypto.randomUUID(),
      name: "جمعية الشغل",
      monthly: 500,
      members: 10,
      payDay: 5,
      startMonth: mk,
      receiveMonth: mk,
      wallet: "cash",
      paidMonths: today >= 5 ? [mk] : [],
      received: false,
    },
  ];
  return data;
}
