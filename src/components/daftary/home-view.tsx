import { BookOpen, Lightbulb, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TxRow } from "./tx-row";
import { MonthHeatmap } from "./heatmap";
import { toneVar } from "./cat-icon";
import { catInfo, useDaftary } from "@/lib/daftary/store";
import { WALLETS } from "@/lib/daftary/constants";
import { currentMonthKey, money, todayIso } from "@/lib/daftary/format";
import { buildInsights, prevMonthKey } from "@/lib/daftary/insights";
import {
  dailyPace,
  frequentDescriptions,
  monthEarned,
  monthSpent,
  netWorth,
  spendByCategory,
  spendByDay,
  walletBalances,
} from "@/lib/daftary/ledger";
import { cn } from "@/lib/utils";

export function HomeView() {
  const transactions = useDaftary((s) => s.transactions);
  const categories = useDaftary((s) => s.categories);
  const budgets = useDaftary((s) => s.budgets);
  const openingBalances = useDaftary((s) => s.openingBalances);
  const setView = useDaftary((s) => s.setView);
  const setDraft = useDaftary((s) => s.setDraft);
  const loadDemo = useDaftary((s) => s.loadDemo);
  const setMorePanel = useDaftary((s) => s.setMorePanel);

  const now = new Date();
  const mk = currentMonthKey(now);
  const monthTx = transactions.filter((t) => t.date.startsWith(mk));
  const spent = monthSpent(transactions, mk);
  const earned = monthEarned(transactions, mk);
  const budget = budgets[mk];
  const pace = dailyPace(spent, budget, now);
  const over = Boolean(pace?.over);
  const balances = walletBalances({ openingBalances, transactions });
  const worth = netWorth(balances);

  const byCat = spendByCategory(transactions, mk);
  const catKeys = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
  const pieData = catKeys.map((k) => ({
    key: k,
    name: catInfo(categories, k).label,
    value: byCat[k],
    tone: catInfo(categories, k).tone,
  }));

  const prevSpent = monthSpent(transactions, prevMonthKey(now));
  const insights = buildInsights(monthTx, budget, prevSpent, categories, now);
  const daily = spendByDay(transactions, mk);
  const today = todayIso(now);
  const todayTx = transactions.filter((t) => t.date === today);
  const recent = transactions.slice(0, 5);
  const chips = frequentDescriptions(transactions);

  function editTx(tx: (typeof transactions)[0]) {
    setDraft({
      id: tx.id,
      type: tx.type,
      amount: String(tx.amount),
      desc: tx.desc,
      category: tx.category,
      date: tx.date,
      wallet: tx.wallet,
      walletTo: tx.walletTo ?? undefined,
    });
    setView("add");
  }

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => {
            setMorePanel("wallets");
            setView("more");
          }}
          className="min-w-[8.5rem] shrink-0 rounded-xl bg-card p-3 text-right text-card-foreground shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Wallet className="size-3" />
            كل المحافظ
          </div>
          <div className="num mt-1 text-lg font-extrabold">{money(worth)}</div>
        </button>
        {WALLETS.map((w) => (
          <div
            key={w.id}
            className="min-w-[7.5rem] shrink-0 rounded-xl bg-card p-3 text-card-foreground shadow-[var(--shadow-card)]"
          >
            <div className="text-[10px] text-muted-foreground">{w.label}</div>
            <div
              className={cn(
                "num mt-1 text-base font-bold",
                (balances[w.id] || 0) < 0 ? "text-destructive" : "",
              )}
            >
              {money(balances[w.id] || 0)}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <div className="text-xs text-muted-foreground">إجمالي مصروفات الشهر</div>
        <div className="num mt-1 flex items-baseline gap-2 text-4xl font-extrabold text-card-foreground">
          {money(spent)}
          <small className="text-base font-normal text-accent">ج.م</small>
        </div>
        {earned > 0 ? (
          <div className="mt-2 text-xs text-muted-foreground">
            الدخل: {money(earned)} ج.م · الصافي: {money(earned - spent)} ج.م
          </div>
        ) : null}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {budget
              ? `من ميزانية ${money(budget)} ج.م`
              : "لسه محددتش ميزانية الشهر — من تبويب الميزانية"}
          </span>
          {pace ? <span className="num">{pace.pct}%</span> : null}
        </div>
        <Progress
          className="mt-2 bg-border"
          value={pace ? pace.pct : 0}
          indicatorClassName={over ? "bg-destructive" : "bg-accent"}
        />
        {pace ? (
          <p className="mt-3 text-xs leading-relaxed text-card-foreground">
            {pace.over
              ? `عدّيت الميزانية بـ ${money(Math.abs(pace.remaining))} ج.م.`
              : `فاضل ${money(pace.remaining)} ج.م على ${pace.leftDays} يوم — يعني حوالي ${money(Math.floor(pace.perDay))} ج.م في اليوم.`}
          </p>
        ) : null}
      </Card>

      {chips.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {chips.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDraft({ desc: d, type: "expense" });
                setView("add");
              }}
              className="h-9 shrink-0 rounded-full border border-border bg-card px-3 text-xs text-card-foreground"
            >
              {d}
            </button>
          ))}
        </div>
      ) : null}

      <Card>
        <CardTitle>توزيع المصروفات حسب الفئة</CardTitle>
        {pieData.length === 0 ? (
          <EmptyLedger onDemo={loadDemo} onAdd={() => setView("add")} />
        ) : (
          <div className="flex items-center gap-4">
            <div className="size-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={32} outerRadius={52} stroke="none">
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={toneVar(d.tone)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {pieData.slice(0, 5).map((d) => (
                <div key={d.key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: toneVar(d.tone) }} />
                    {d.name}
                  </span>
                  <span className="num text-muted-foreground">{money(d.value)} ج.م</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {insights.length > 0 ? (
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Lightbulb className="size-4 text-accent" />
              رؤى من الدفتر
            </span>
          </CardTitle>
          <div className="flex flex-col gap-2">
            {insights.map((m) => (
              <div
                key={m}
                className="rounded-md border-r-2 border-accent bg-secondary px-3 py-2 text-xs leading-relaxed text-card-foreground"
              >
                {m}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {spent > 0 ? (
        <Card>
          <CardTitle>حرارة الشهر</CardTitle>
          <MonthHeatmap monthKey={mk} daily={daily} />
        </Card>
      ) : null}

      <Card className="paper-page">
        <CardTitle>صفحة اليوم</CardTitle>
        {todayTx.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">لسه مفيش سطر النهارده</p>
        ) : (
          todayTx.map((t) => (
            <TxRow key={t.id} tx={t} categories={categories} compact onEdit={editTx} />
          ))
        )}
      </Card>

      <Card>
        <CardTitle>
          <span>آخر الحركات</span>
          <button
            type="button"
            className="text-xs font-normal text-accent"
            onClick={() => setView("history")}
          >
            عرض الكل
          </button>
        </CardTitle>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">لسه مفيش حركة في الدفتر</p>
        ) : (
          recent.map((t) => (
            <TxRow key={t.id} tx={t} categories={categories} compact onEdit={editTx} />
          ))
        )}
      </Card>
    </div>
  );
}

function EmptyLedger({ onDemo, onAdd }: { onDemo: () => void; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-2 py-6 pb-8 text-center">
      <BookOpen className="mb-3 size-8 text-accent" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">لسه مفيش مصروفات مسجلة الشهر ده</p>
      <div className="mt-4 flex w-full flex-col gap-2">
        <Button type="button" onClick={onAdd}>
          سجّل أول مصروف
        </Button>
        <Button type="button" variant="outline" onClick={onDemo}>
          افتح دفتر تجريبي
        </Button>
      </div>
    </div>
  );
}
