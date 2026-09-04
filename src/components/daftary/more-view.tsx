import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Bell,
  ChevronLeft,
  Download,
  Lock,
  Moon,
  PiggyBank,
  Share2,
  Smartphone,
  Sun,
  Tags,
  Trash2,
  Upload,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CatIcon, toneVar } from "./cat-icon";
import { EMPTY_WALLETS, ICON_OPTIONS, WALLETS } from "@/lib/daftary/constants";
import { currentMonthKey, money, monthLabel } from "@/lib/daftary/format";
import { monthReportText, netWorth, walletBalances } from "@/lib/daftary/ledger";
import { ensureNotifyPermission } from "@/lib/daftary/notify";
import { toBackupJson } from "@/lib/daftary/storage";
import { useDaftary } from "@/lib/daftary/store";
import type { CatTone, IconKey, MorePanel, OpeningBalances, WalletId } from "@/lib/daftary/types";
import { cn } from "@/lib/utils";

const TONES: CatTone[] = [
  "food",
  "transport",
  "bills",
  "shopping",
  "health",
  "fun",
  "education",
  "other",
];

export function MoreView() {
  const panel = useDaftary((s) => s.morePanel);
  const setMorePanel = useDaftary((s) => s.setMorePanel);
  if (panel === "menu") return <MoreMenu onOpen={setMorePanel} />;
  return (
    <div>
      <button
        type="button"
        className="mb-3 flex min-h-11 items-center gap-1 text-sm text-foreground/80"
        onClick={() => setMorePanel("menu")}
      >
        <ChevronLeft className="size-4 rotate-180" />
        رجوع
      </button>
      {panel === "goals" ? <GoalsPanel /> : null}
      {panel === "categories" ? <CatsPanel /> : null}
      {panel === "lock" ? <LockPanel /> : null}
      {panel === "backup" ? <BackupPanel /> : null}
      {panel === "jam3eya" ? <Jam3eyaPanel /> : null}
      {panel === "install" ? <InstallPanel /> : null}
      {panel === "report" ? <ReportPanel /> : null}
      {panel === "wallets" ? <WalletsPanel /> : null}
    </div>
  );
}

function MoreMenu({ onOpen }: { onOpen: (p: MorePanel) => void }) {
  const theme = useDaftary((s) => s.theme);
  const toggleTheme = useDaftary((s) => s.toggleTheme);
  const loadDemo = useDaftary((s) => s.loadDemo);
  const wipeAll = useDaftary((s) => s.wipeAll);
  const pin = useDaftary((s) => s.pin);
  const notifyEnabled = useDaftary((s) => s.notifyEnabled);
  const setNotifyEnabled = useDaftary((s) => s.setNotifyEnabled);
  const [wipe, setWipe] = useState(false);

  const items: { id: MorePanel; label: string; hint: string; icon: typeof PiggyBank }[] = [
    { id: "wallets", label: "أرصدة المحافظ", hint: "كاش، فودافون، إنستاباي، بنك", icon: Wallet },
    { id: "goals", label: "أهداف الادخار", hint: "لابتوب، رحلة، جمعية", icon: PiggyBank },
    { id: "jam3eya", label: "الجمعية", hint: "قسط ووشّ — زي الكناش الورقي", icon: UsersRound },
    { id: "categories", label: "الفئات", hint: "عدّل أو أضف تصنيف", icon: Tags },
    { id: "lock", label: "قفل الدفتر", hint: pin ? "الرقم السري شغال" : "اختياري — 4 أرقام", icon: Lock },
    { id: "backup", label: "نسخة احتياطية", hint: "تصدير واستيراد JSON", icon: Archive },
    { id: "report", label: "تقرير الشهر", hint: "صفحة تتشاركها على واتساب", icon: Share2 },
    { id: "install", label: "ثبّت دفتري", hint: "شاشة رئيسية أو نسخة أندرويد", icon: Smartphone },
  ];

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onOpen(it.id)}
          className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-card p-4 text-right text-card-foreground shadow-[var(--shadow-card)]"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <it.icon className="size-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold">{it.label}</span>
            <span className="block text-xs text-muted-foreground">{it.hint}</span>
          </span>
          <ChevronLeft className="size-4 rotate-180 text-muted-foreground" />
        </button>
      ))}

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold">المظهر</div>
            <div className="text-xs text-muted-foreground">
              {theme === "dark" ? "ليلي" : "ورقي فاتح"}
            </div>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={toggleTheme} aria-label="تبديل المظهر">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Bell className="size-4 text-accent" />
              تذكير الميزانية والجمعية
            </div>
            <div className="text-xs text-muted-foreground">إشعار لما تفتح الدفتر لو فيه حاجة مستحقة</div>
          </div>
          <Button
            type="button"
            variant={notifyEnabled ? "brass" : "outline"}
            onClick={async () => {
              if (!notifyEnabled) {
                const ok = await ensureNotifyPermission();
                if (!ok) {
                  toast.error("الإشعارات مقفولة من المتصفح");
                  return;
                }
              }
              await setNotifyEnabled(!notifyEnabled);
              toast.success(notifyEnabled ? "التذكير اتقفل" : "التذكير اشتغل");
            }}
          >
            {notifyEnabled ? "شغال" : "تشغيل"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            loadDemo();
            toast.success("اتفتح دفتر تجريبي");
          }}
        >
          دفتر تجريبي
        </Button>
        <Button type="button" variant="destructive" onClick={() => setWipe(true)}>
          مسح الدفتر
        </Button>
      </div>

      <AlertDialog open={wipe} onOpenChange={setWipe}>
        <AlertDialogContent>
          <AlertDialogTitle>تمسح الدفتر كله؟</AlertDialogTitle>
          <AlertDialogDescription>
            كل المصروفات والأهداف ودفتر الناس هيروحوا. لو معندكش نسخة JSON، مفيش رجوع.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                wipeAll();
                toast.success("الدفتر اتمسح");
              }}
            >
              امسح
            </AlertDialogAction>
            <AlertDialogCancel>رجوع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GoalsPanel() {
  const goals = useDaftary((s) => s.goals);
  const addGoal = useDaftary((s) => s.addGoal);
  const contributeGoal = useDaftary((s) => s.contributeGoal);
  const deleteGoal = useDaftary((s) => s.deleteGoal);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [amt, setAmt] = useState("");
  const [wallet, setWallet] = useState<WalletId>("cash");

  function add() {
    const t = parseFloat(target);
    if (!name.trim()) return toast.error("اكتب اسم الهدف");
    if (!t || t <= 0) return toast.error("اكتب مبلغ مستهدف صحيح");
    addGoal(name.trim(), t);
    setName("");
    setTarget("");
    toast.success("تم إضافة الهدف");
  }

  const g = goals.find((x) => x.id === active);

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>هدف ادخار جديد</CardTitle>
        <Label>اسم الهدف</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="رحلة، لابتوب" />
        <div className="mt-3">
          <Label>المبلغ المستهدف (ج.م)</Label>
          <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <Button type="button" className="mt-4 w-full" onClick={add}>
          إضافة هدف
        </Button>
      </Card>
      {goals.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">لسه معملتش أي هدف ادخار</p>
      ) : (
        goals.map((goal) => {
          const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
          return (
            <Card key={goal.id}>
              <CardTitle>
                <span>{goal.name}</span>
                <button
                  type="button"
                  className="text-muted-foreground"
                  onClick={() => deleteGoal(goal.id)}
                  aria-label="حذف"
                >
                  <Trash2 className="size-4" />
                </button>
              </CardTitle>
              <div className="mb-2 flex justify-between text-xs">
                <span>
                  {money(goal.saved)} من {money(goal.target)} ج.م
                </span>
                <span className="num">{pct}%</span>
              </div>
              <Progress value={pct} className="bg-border" />
              <Button
                type="button"
                variant="brass"
                className="mt-3 w-full"
                onClick={() => {
                  setActive(goal.id);
                  setAmt("");
                }}
              >
                إضافة مبلغ للهدف
              </Button>
            </Card>
          );
        })
      )}

      <Dialog open={Boolean(g)} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogTitle>إضافة لـ {g?.name}</DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">هيتخصم من المحفظة ويتسجل كادخار في الدفتر.</p>
          <Input
            className="mt-4"
            type="number"
            inputMode="decimal"
            placeholder="كام ج.م؟"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {WALLETS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setWallet(w.id)}
                className={cn(
                  "h-9 rounded-full border px-3 text-xs",
                  wallet === w.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={() => {
              const n = parseFloat(amt);
              if (!n || n <= 0 || !g) return toast.error("اكتب مبلغ صحيح");
              contributeGoal(g.id, n, wallet);
              const done = g.saved + n >= g.target;
              toast.success(done ? "وصلت لهدفك واتخصم من المحفظة" : "اتخصم واتسجل في الدفتر");
              setActive(null);
            }}
          >
            تأكيد
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CatsPanel() {
  const categories = useDaftary((s) => s.categories);
  const addCategory = useDaftary((s) => s.addCategory);
  const deleteCategory = useDaftary((s) => s.deleteCategory);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState<IconKey>("package");
  const [tone, setTone] = useState<CatTone>("other");

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>فئة جديدة</CardTitle>
        <Label>الاسم</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="جمعية، سجائر…" />
        <div className="mt-3">
          <Label>أيقونة</Label>
          <div className="mt-1 grid grid-cols-6 gap-1">
            {ICON_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setIcon(o.id)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-md border",
                  icon === o.id ? "border-accent bg-accent/15" : "border-border",
                )}
                aria-label={o.label}
              >
                <CatIcon name={o.id} />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <Label>لون</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={cn("size-7 rounded-full ring-offset-2", tone === t ? "ring-2 ring-accent" : "")}
                style={{ background: toneVar(t) }}
                aria-label={t}
              />
            ))}
          </div>
        </div>
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={() => {
            if (!label.trim()) return toast.error("اكتب اسم الفئة");
            addCategory({ label: label.trim(), icon, tone });
            setLabel("");
            toast.success("اتضافت الفئة");
          }}
        >
          إضافة
        </Button>
      </Card>
      <Card>
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between border-b border-dashed border-border py-3 last:border-0"
          >
            <span className="flex items-center gap-2 text-sm">
              <span style={{ color: toneVar(c.tone) }}>
                <CatIcon name={c.icon} />
              </span>
              {c.label}
            </span>
            {c.builtin ? (
              <span className="text-xs text-muted-foreground">أساسية</span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => deleteCategory(c.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

function LockPanel() {
  const pin = useDaftary((s) => s.pin);
  const setPin = useDaftary((s) => s.setPin);
  const clearPin = useDaftary((s) => s.clearPin);
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  return (
    <Card>
      <CardTitle>قفل الدفتر</CardTitle>
      <p className="mb-4 text-sm text-muted-foreground">
        رقم من 4 أرقام. بيتخزّن بتشفير PBKDF2 على الجهاز، ومش بيتضاف لنسخة الـ JSON.
      </p>
      {pin ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            clearPin();
            toast.success("اتشال القفل");
          }}
        >
          إلغاء الرقم السري
        </Button>
      ) : (
        <>
          <Label>الرقم</Label>
          <Input
            inputMode="numeric"
            maxLength={4}
            value={a}
            onChange={(e) => setA(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          <div className="mt-3">
            <Label>تأكيد الرقم</Label>
            <Input
              inputMode="numeric"
              maxLength={4}
              value={b}
              onChange={(e) => setB(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={async () => {
              if (a.length !== 4) return toast.error("الرقم لازم 4 أرقام");
              if (a !== b) return toast.error("الرقمين مش زي بعض");
              await setPin(a);
              toast.success("القفل اشتغل");
              setA("");
              setB("");
            }}
          >
            تفعيل القفل
          </Button>
        </>
      )}
    </Card>
  );
}

function BackupPanel() {
  const store = useDaftary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [pending, setPending] = useState<string | null>(null);

  function exportJson() {
    const json = toBackupJson({
      version: 3,
      theme: store.theme,
      pin: null,
      onboarded: store.onboarded,
      openingBalances: store.openingBalances,
      transactions: store.transactions,
      budgets: store.budgets,
      categoryBudgets: store.categoryBudgets,
      recurring: store.recurring,
      goals: store.goals,
      people: store.people,
      categories: store.categories,
      jam3eyat: store.jam3eyat,
      notifyEnabled: store.notifyEnabled,
    });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daftary-backup-${currentMonthKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("اتنزّلت النسخة الاحتياطية");
  }

  return (
    <Card>
      <CardTitle>نسخة احتياطية</CardTitle>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        ملف JSON واحد فيه المصروفات والميزانية والأهداف والجمعية ودفتر الناس. انقله لواتساب أو درايف. الرقم
        السري مش جواه.
      </p>
      <Button type="button" className="w-full" onClick={exportJson}>
        <Download className="size-4" />
        تصدير JSON
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const text = await file.text();
          setPending(text);
        }}
      />
      <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => fileRef.current?.click()}>
        <Upload className="size-4" />
        استيراد ملف
      </Button>

      <AlertDialog open={Boolean(pending)} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>طريقة الاستيراد</AlertDialogTitle>
          <AlertDialogDescription>دمج مع الموجود، ولا استبدال الدفتر كله؟</AlertDialogDescription>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "merge" ? "default" : "outline"} onClick={() => setMode("merge")}>
              دمج
            </Button>
            <Button
              type="button"
              variant={mode === "replace" ? "destructive" : "outline"}
              onClick={() => setMode("replace")}
            >
              استبدال
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (!pending) return;
                try {
                  store.importRaw(pending, mode);
                  toast.success(mode === "merge" ? "اتدمجت النسخة" : "الدفتر اتبدّل");
                } catch {
                  toast.error("الملف مش صالح");
                }
                setPending(null);
              }}
            >
              تنفيذ
            </AlertDialogAction>
            <AlertDialogCancel>رجوع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function Jam3eyaPanel() {
  const jam3eyat = useDaftary((s) => s.jam3eyat);
  const addJam3eya = useDaftary((s) => s.addJam3eya);
  const payJam3eya = useDaftary((s) => s.payJam3eya);
  const receiveJam3eya = useDaftary((s) => s.receiveJam3eya);
  const deleteJam3eya = useDaftary((s) => s.deleteJam3eya);
  const mk = currentMonthKey();
  const [name, setName] = useState("");
  const [monthly, setMonthly] = useState("");
  const [members, setMembers] = useState("10");
  const [payDay, setPayDay] = useState("5");
  const [receiveMonth, setReceiveMonth] = useState(mk);
  const [wallet, setWallet] = useState<WalletId>("cash");

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>جمعية جديدة</CardTitle>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          زي الجمعية الورقية: قسط كل شهر، وفي شهر معيّن تاخد الوش. القسط بيتسجل مصروف، والوش بيتسجل دخل.
        </p>
        <Label>الاسم</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="جمعية الشغل" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <Label>القسط</Label>
            <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </div>
          <div>
            <Label>عدد الأفراد</Label>
            <Input type="number" value={members} onChange={(e) => setMembers(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <Label>يوم الدفع</Label>
            <Input type="number" value={payDay} onChange={(e) => setPayDay(e.target.value)} />
          </div>
          <div>
            <Label>شهر الوش</Label>
            <Input type="month" value={receiveMonth} onChange={(e) => setReceiveMonth(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {WALLETS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWallet(w.id)}
              className={cn(
                "h-9 rounded-full border px-3 text-xs",
                wallet === w.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={() => {
            const m = parseFloat(monthly);
            const n = parseInt(members, 10);
            const d = parseInt(payDay, 10);
            if (!name.trim()) return toast.error("اكتب اسم الجمعية");
            if (!m || m <= 0 || !n || n < 2) return toast.error("القسط وعدد الأفراد لازم صح");
            addJam3eya({
              name: name.trim(),
              monthly: m,
              members: n,
              payDay: Math.min(28, Math.max(1, d || 1)),
              startMonth: mk,
              receiveMonth,
              wallet,
            });
            setName("");
            toast.success("اتضافت الجمعية");
          }}
        >
          حفظ الجمعية
        </Button>
      </Card>

      {jam3eyat.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">لسه معندكش جمعية مسجّلة</p>
      ) : (
        jam3eyat.map((j) => {
          const paid = j.paidMonths.includes(mk);
          const pot = j.monthly * j.members;
          const isReceive = j.receiveMonth === mk;
          return (
            <Card key={j.id}>
              <CardTitle>
                <span>{j.name}</span>
                <button type="button" onClick={() => deleteJam3eya(j.id)} aria-label="حذف">
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </CardTitle>
              <p className="text-sm text-card-foreground">
                قسط {money(j.monthly)} ج.م · {j.members} أفراد · الوش {money(pot)} ج.م
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                يوم {j.payDay} كل شهر · شهر الوش {monthLabel(j.receiveMonth)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paid ? "outline" : "default"}
                  disabled={paid}
                  onClick={() => {
                    payJam3eya(j.id);
                    toast.success("اتسجل قسط الجمعية في الدفتر");
                  }}
                >
                  {paid ? "اتدفع الشهر ده" : "دفعت القسط"}
                </Button>
                <Button
                  type="button"
                  variant={j.received ? "outline" : "brass"}
                  disabled={j.received || !isReceive}
                  onClick={() => {
                    receiveJam3eya(j.id);
                    toast.success("اتسجل الوش كدخل");
                  }}
                >
                  {j.received ? "الوش اتقبض" : isReceive ? "قبضت الوش" : "لسه مش شهرك"}
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

function WalletsPanel() {
  const openingBalances = useDaftary((s) => s.openingBalances);
  const transactions = useDaftary((s) => s.transactions);
  const setOpeningBalances = useDaftary((s) => s.setOpeningBalances);
  const setView = useDaftary((s) => s.setView);
  const setDraft = useDaftary((s) => s.setDraft);
  const [draft, setLocal] = useState<OpeningBalances>({ ...EMPTY_WALLETS, ...openingBalances });
  const live = walletBalances({ openingBalances, transactions });

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>الرصيد الحالي</CardTitle>
        <div className="num mb-4 text-3xl font-extrabold">{money(netWorth(live))} ج.م</div>
        {WALLETS.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between border-b border-dashed border-border py-2 last:border-0"
          >
            <span className="text-sm">{w.label}</span>
            <span className={cn("num font-bold", live[w.id] < 0 ? "text-destructive" : "")}>
              {money(live[w.id])}
            </span>
          </div>
        ))}
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={() => {
            setDraft({ type: "transfer" });
            setView("add");
          }}
        >
          تحويل بين المحافظ
        </Button>
      </Card>
      <Card>
        <CardTitle>الرصيد الافتتاحي</CardTitle>
        <p className="mb-3 text-xs text-muted-foreground">
          الرقم اللي كان في المحفظة قبل ما تبدأ تسجّل. الرصيد الحالي = الافتتاحي + الدخل − الصرف ± التحويل.
        </p>
        {WALLETS.map((w) => (
          <div key={w.id} className="mb-3 last:mb-0">
            <Label>{w.label}</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={draft[w.id] || ""}
              onChange={(e) => setLocal({ ...draft, [w.id]: parseFloat(e.target.value) || 0 })}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="brass"
          className="mt-2 w-full"
          onClick={() => {
            setOpeningBalances(draft);
            toast.success("اتحفظ الرصيد الافتتاحي");
          }}
        >
          حفظ
        </Button>
      </Card>
    </div>
  );
}

function ReportPanel() {
  const store = useDaftary();
  const mk = currentMonthKey();
  const text = monthReportText(store, mk, store.categories);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "دفتري", text });
        return;
      }
    } catch {
      /* cancelled */
    }
    await navigator.clipboard.writeText(text);
    toast.success("اتنسخ التقرير");
  }

  return (
    <Card className="paper-page">
      <CardTitle>تقرير {monthLabel()}</CardTitle>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-card-foreground">{text}</pre>
      <Button type="button" className="mt-4 w-full" onClick={share}>
        <Share2 className="size-4" />
        شارك على واتساب
      </Button>
    </Card>
  );
}

function InstallPanel() {
  const [deferred, setDeferred] = useState<{ prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      const ev = e as Event & { prompt: () => Promise<void> };
      setDeferred(ev);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <Card>
      <CardTitle>ثبّت دفتري على الموبايل</CardTitle>
      <p className="text-sm leading-relaxed text-muted-foreground">
        دفتري تطبيق ويب يتثبّت زي أي تطبيق: على الشاشة الرئيسية، أو كنسخة أندرويد (TWA) مربوطة بنفس الموقع.
        البيانات تفضل على جهازك.
      </p>
      {deferred ? (
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
        >
          إضافة للشاشة الرئيسية
        </Button>
      ) : (
        <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs leading-relaxed text-card-foreground">
          من متصفح كروم: القائمة ← إضافة إلى الشاشة الرئيسية. من آيفون: زر المشاركة ← إضافة إلى الشاشة الرئيسية.
        </p>
      )}
      <div className="mt-4 rounded-lg border border-border p-3 text-xs leading-relaxed text-muted-foreground">
        نسخة أندرويد (TWA) بتستخدم الحزمة
        <span className="num mx-1 text-card-foreground">app.vercel.daftary_apk.twa</span>
        وملف Digital Asset Links الموجود مع المشروع. البناء التلقائي جاهز في مستودع GitHub كـ workflow باسم Build
        TWA APK، بنفس مفاتيح التوقيع القديمة.
      </div>
    </Card>
  );
}
