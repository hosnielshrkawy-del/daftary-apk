import { NOTIFY_KEY } from "./constants";
import { currentMonthKey, money, todayIso } from "./format";
import { dailyPace, monthSpent } from "./ledger";
import type { DaftaryData } from "./types";

export async function ensureNotifyPermission() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function pingReminders(data: DaftaryData) {
  if (!data.notifyEnabled || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  const today = todayIso();
  if (sessionStorage.getItem(NOTIFY_KEY) === today) return;
  sessionStorage.setItem(NOTIFY_KEY, today);

  const mk = currentMonthKey();
  const spent = monthSpent(data.transactions, mk);
  const pace = dailyPace(spent, data.budgets[mk]);
  const day = new Date().getDate();

  if (pace && pace.over) {
    new Notification("دفتري", {
      body: `عدّيت ميزانية الشهر بـ ${money(Math.abs(pace.remaining))} ج.م`,
      tag: "budget-over",
    });
  } else if (pace && pace.pct >= 80) {
    new Notification("دفتري", {
      body: `الميزانية عند ${pace.pct}% — فاضل حوالي ${money(Math.max(0, pace.perDay))} ج.م في اليوم`,
      tag: "budget-pace",
    });
  }

  for (const j of data.jam3eyat) {
    if (j.payDay === day && !j.paidMonths.includes(mk)) {
      new Notification("دفتري", {
        body: `النهارده يوم جمعية «${j.name}» — ${money(j.monthly)} ج.م`,
        tag: `jam-${j.id}`,
      });
    }
  }
}
