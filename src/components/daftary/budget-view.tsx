import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CatIcon, toneVar } from "./cat-icon";
import { catInfo, useDaftary } from "@/lib/daftary/store";
import { currentMonthKey, money, monthLabel, walletLabel } from "@/lib/daftary/format";
import { WALLETS } from "@/lib/daftary/constants";
import { dailyPace, spendByCategory } from "@/lib/daftary/ledger";
import { cn } from "@/lib/utils";

export function BudgetView() {
  const transactions = useDaftary((s) => s.transactions);
  const categories = useDaftary((s) => s.categories);
  const budgets = useDaftary((s) => s.budgets);
  const categoryBudgets = useDaftary((s) => s.categoryBudgets);
  const recurring = useDaftary((s) => s.recurring);
  const setBudget = useDaftary((s) => s.setBudget);
  const setCategoryBudget = useDaftary((s) => s.setCategoryBudget);
  const deleteRecurring = useDaftary((s) => s.deleteRecurring);

  const mk = currentMonthKey();
  const [val, setVal] = useState(String(budgets[mk] || ""));

  const monthTx = transactions.filter((t) => t.date.startsWith(mk) && t.type === "expense");
  const byCat = spendByCategory(transactions, mk);
  const total = monthTx.reduce((s, t) => s + t.amount, 0);
  const pace = dailyPace(total, budgets[mk]);

  const byWallet: Record<string, number> = {};
  monthTx.forEach((t) => {
    byWallet[t.wallet] = (byWallet[t.wallet] || 0) + t.amount;
  });

  function save() {
    const n = parseFloat(val);
    if (!n || n <= 0) {
      toast.error("اكتب رقم ميزانية صحيح");
      return;
    }
    setBudget(mk, n);
    toast.success("تم حفظ الميزانية");
  }

  const expenseCats = categories.filter((c) => c.tone !== "income");

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>الميزانية الشهرية</CardTitle>
        <Label>حدد ميزانيتك لشهر {monthLabel()}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="مثال: 5000"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <Button type="button" variant="brass" onClick={save}>
            حفظ
          </Button>
        </div>
        {pace ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {pace.over
              ? `تجاوزت الميزانية. الإيقاع اليومي اتكسر.`
              : `الإيقاع: حوالى ${money(Math.floor(pace.perDay))} ج.م في اليوم لـ ${pace.leftDays} يوم فاضلين.`}
          </p>
        ) : null}
      </Card>

      <Card>
        <CardTitle>ميزانية لكل فئة</CardTitle>
        <p className="mb-3 text-xs text-muted-foreground">
          حط سقف للفئة. الشريط يحمر لما توصل لـ ٨٠٪.
        </p>
        <div className="space-y-3">
          {expenseCats.map((c) => {
            const used = byCat[c.id] || 0;
            const cap = categoryBudgets[mk]?.[c.id] || 0;
            const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
            const warn = cap > 0 && pct >= 80;
            return (
              <div key={c.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span style={{ color: toneVar(c.tone) }}>
                      <CatIcon name={c.icon} />
                    </span>
                    {c.label}
                  </span>
                  <span className="num text-xs text-muted-foreground">
                    {money(used)}
                    {cap ? ` / ${money(cap)}` : ""}
                  </span>
                </div>
                {cap ? (
                  <Progress
                    value={pct}
                    className="mb-1.5 bg-border"
                    indicatorClassName={warn ? "bg-destructive" : undefined}
                  />
                ) : null}
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="سقف الفئة"
                  className="h-9"
                  defaultValue={cap || ""}
                  onBlur={(e) => {
                    const n = parseFloat(e.target.value) || 0;
                    setCategoryBudget(mk, c.id, n);
                  }}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>الاستهلاك حسب الفئة</CardTitle>
        {Object.keys(byCat).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            سجّل مصروفات الأول عشان تتابع استهلاكك
          </p>
        ) : (
          Object.keys(byCat)
            .sort((a, b) => byCat[b] - byCat[a])
            .map((k) => {
              const c = catInfo(categories, k);
              const pct = total ? Math.round((byCat[k] / total) * 100) : 0;
              return (
                <div key={k} className="mb-3 last:mb-0">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span style={{ color: toneVar(c.tone) }}>
                        <CatIcon name={c.icon} />
                      </span>
                      {c.label}
                    </span>
                    <span className="num font-bold">{money(byCat[k])} ج.م</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: toneVar(c.tone) }}
                    />
                  </div>
                </div>
              );
            })
        )}
      </Card>

      <Card>
        <CardTitle>حسب المحفظة</CardTitle>
        {WALLETS.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between border-b border-dashed border-border py-2 text-sm last:border-0"
          >
            <span>{w.label}</span>
            <span className="num">{money(byWallet[w.id] || 0)} ج.م</span>
          </div>
        ))}
      </Card>

      {recurring.length > 0 ? (
        <Card>
          <CardTitle>الحركات الثابتة الشهرية</CardTitle>
          {recurring.map((t) => {
            const c = catInfo(categories, t.category);
            const expense = t.type === "expense";
            return (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 border-b border-dashed border-border py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: toneVar(c.tone) }}>
                    <CatIcon name={c.icon} />
                  </span>
                  <div>
                    <div className="text-sm font-medium">{t.desc}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.label} · كل شهر يوم {t.dayOfMonth} · {walletLabel(t.wallet)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("num text-sm font-bold", expense ? "text-destructive" : "text-income")}>
                    {expense ? "−" : "+"}
                    {money(t.amount)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground"
                    onClick={() => deleteRecurring(t.id)}
                    aria-label="إيقاف التكرار"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      ) : null}
    </div>
  );
}
