import { money, daysInMonth } from "./format";
import type { Category, Transaction } from "./types";

export { monthEarned, monthSpent, prevMonthKey } from "./ledger";

export function buildInsights(
  monthTx: Transaction[],
  budget: number | undefined,
  prevTotal: number,
  categories: Category[],
  now = new Date(),
) {
  const insights: string[] = [];
  const expenses = monthTx.filter((t) => t.type === "expense");
  const income = monthTx.filter((t) => t.type === "income");
  const spent = expenses.reduce((s, t) => s + t.amount, 0);
  const earned = income.reduce((s, t) => s + t.amount, 0);
  const catInfo = (id: string) =>
    categories.find((c) => c.id === id) ?? categories[categories.length - 1];

  const catTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const catKeys = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

  if (catKeys.length >= 1 && spent > 0) {
    const top = catKeys[0];
    const pct = Math.round((catTotals[top] / spent) * 100);
    insights.push(
      `أكتر فئة بتصرف عليها الشهر ده هي «${catInfo(top).label}» بنسبة ${pct}% من مصروفاتك.`,
    );
  }

  const dayOfMonth = now.getDate();
  const dim = daysInMonth(now);
  if (spent > 0 && dayOfMonth >= 3 && dayOfMonth < dim) {
    const projected = Math.round((spent / dayOfMonth) * dim);
    if (budget && projected > budget) {
      insights.push(
        `بمعدل صرفك الحالي، متوقع توصل لـ ${money(projected)} ج.م آخر الشهر — يعني هتتجاوز ميزانيتك بحوالي ${money(projected - budget)} ج.م.`,
      );
    } else if (budget) {
      insights.push(
        `بمعدل صرفك الحالي، متوقع تخلّص الشهر عند حوالي ${money(projected)} ج.م — في حدود ميزانيتك.`,
      );
    }
  }

  if (budget && spent > budget) {
    insights.push(`أنت متجاوز ميزانية الشهر بمقدار ${money(spent - budget)} ج.م.`);
  } else if (budget && spent > budget * 0.8) {
    insights.push(
      `قربت توصل لميزانيتك (${Math.round((spent / budget) * 100)}%)، خد بالك في الباقي من الشهر.`,
    );
  }

  if (earned > 0) {
    const saved = earned - spent;
    if (saved >= 0) {
      insights.push(
        `دخلك الشهر ده ${money(earned)} ج.م، وصرفت ${money(spent)} — تبقى لك ${money(saved)} ج.م.`,
      );
    } else {
      insights.push(`صرفت ${money(Math.abs(saved))} ج.م فوق دخلك هذا الشهر.`);
    }
  }

  if (prevTotal > 0 && spent > 0) {
    const diffPct = Math.round(((spent - prevTotal) / prevTotal) * 100);
    if (diffPct > 5) insights.push(`صرفك الشهر ده أعلى من الشهر اللي فات بنسبة ${diffPct}%.`);
    else if (diffPct < -5)
      insights.push(`صرفك الشهر ده أقل من الشهر اللي فات بنسبة ${Math.abs(diffPct)}% — كده كويس.`);
  }

  if (expenses.length >= 5) {
    const dowSums = [0, 0, 0, 0, 0, 0, 0];
    expenses.forEach((t) => {
      dowSums[new Date(t.date + "T00:00:00").getDay()] += t.amount;
    });
    const maxDow = dowSums.indexOf(Math.max(...dowSums));
    const dowNames = ["الأحد", "الاتنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    if (dowSums[maxDow] > spent * 0.25) {
      insights.push(`بتصرف أكتر يوم ${dowNames[maxDow]} عادةً — لاحظ الاتجاه ده لو حابب توفر.`);
    }
  }

  const food = catTotals.food || 0;
  if (spent > 0 && food / spent >= 0.4) {
    insights.push("الأكل ماسك حصة كبيرة من الدفتر. لو في توصيل كل يوم، الأسبوع ده فرصة تقلل مرة.");
  }

  return insights;
}
