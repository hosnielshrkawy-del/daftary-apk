import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Check, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WALLETS } from "@/lib/daftary/constants";
import { useDaftary } from "@/lib/daftary/store";
import { formatDate, money, todayIso } from "@/lib/daftary/format";
import type { PersonEntry, WalletId } from "@/lib/daftary/types";
import { cn } from "@/lib/utils";

export function PeopleView() {
  const people = useDaftary((s) => s.people);
  const addPerson = useDaftary((s) => s.addPerson);
  const settlePerson = useDaftary((s) => s.settlePerson);
  const deletePerson = useDaftary((s) => s.deletePerson);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"lent" | "owed">("lent");
  const [note, setNote] = useState("");
  const [wallet, setWallet] = useState<WalletId>("cash");
  const [pending, setPending] = useState<PersonEntry | null>(null);
  const [mode, setMode] = useState<"settle" | "delete" | null>(null);
  const [settleWallet, setSettleWallet] = useState<WalletId>("cash");

  const open = people.filter((p) => !p.settled);
  const closed = people.filter((p) => p.settled);
  const theyOwe = open.filter((p) => p.direction === "lent").reduce((s, p) => s + p.amount, 0);
  const youOwe = open.filter((p) => p.direction === "owed").reduce((s, p) => s + p.amount, 0);

  function save() {
    const n = parseFloat(amount);
    if (!name.trim()) {
      toast.error("اكتب اسم الشخص");
      return;
    }
    if (!n || n <= 0) {
      toast.error("اكتب مبلغ صحيح");
      return;
    }
    addPerson({
      name: name.trim(),
      amount: n,
      direction,
      note: note.trim(),
      date: todayIso(),
      wallet,
    });
    setName("");
    setAmount("");
    setNote("");
    toast.success("اتسجلت في دفتر الناس");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">ليك عند الناس</div>
          <div className="num mt-1 text-xl font-bold text-income">{money(theyOwe)} ج.م</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">عليك للناس</div>
          <div className="num mt-1 text-xl font-bold text-destructive">{money(youOwe)} ج.م</div>
        </Card>
      </div>

      <Card>
        <CardTitle>حركة جديدة</CardTitle>
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
          <button
            type="button"
            className={cn(
              "h-10 rounded-md text-sm",
              direction === "lent" ? "bg-income text-income-foreground" : "text-muted-foreground",
            )}
            onClick={() => setDirection("lent")}
          >
            ليا عليه
          </button>
          <button
            type="button"
            className={cn(
              "h-10 rounded-md text-sm",
              direction === "owed"
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground",
            )}
            onClick={() => setDirection("owed")}
          >
            عليّا لفلان
          </button>
        </div>
        <Label htmlFor="pname">الاسم</Label>
        <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="أحمد" />
        <div className="mt-3">
          <Label htmlFor="pamt">المبلغ (ج.م)</Label>
          <Input
            id="pamt"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <Label htmlFor="pnote">ملاحظة</Label>
          <Input
            id="pnote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اختياري"
          />
        </div>
        <div className="mt-3">
          <Label>المحفظة المرتبطة</Label>
          <div className="mt-1 flex flex-wrap gap-2">
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
        </div>
        <Button type="button" className="mt-4 w-full" onClick={save}>
          حفظ في دفتر الناس
        </Button>
      </Card>

      <Card>
        <CardTitle>مفتوح</CardTitle>
        {open.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center text-sm text-muted-foreground">
            <Users className="mb-2 size-7 text-accent" />
            مفيش سلف مفتوحة
          </div>
        ) : (
          open.map((p) => (
            <PersonRow
              key={p.id}
              p={p}
              onSettle={() => {
                setPending(p);
                setSettleWallet(p.wallet ?? "cash");
                setMode("settle");
              }}
              onDelete={() => {
                setPending(p);
                setMode("delete");
              }}
            />
          ))
        )}
      </Card>

      {closed.length > 0 ? (
        <Card>
          <CardTitle>اتقفلت</CardTitle>
          {closed.map((p) => (
            <PersonRow key={p.id} p={p} settled />
          ))}
        </Card>
      ) : null}

      <AlertDialog open={Boolean(pending && mode)} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{mode === "settle" ? "تقفيل السلفة؟" : "مسح السطر؟"}</AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "settle"
              ? `هتتقفل حركة ${pending?.name} بقيمة ${pending ? money(pending.amount) : ""} ج.م، وتتسجّل في الدفتر على المحفظة اللي تختارها.`
              : "السطر هيتشال من دفتر الناس."}
          </AlertDialogDescription>
          {mode === "settle" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {WALLETS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSettleWallet(w.id)}
                  className={cn(
                    "h-9 rounded-full border px-3 text-xs",
                    settleWallet === w.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (!pending) return;
                if (mode === "settle") {
                  settlePerson(pending.id, settleWallet);
                  toast.success("اتقفلت واتسجلت في الدفتر");
                } else deletePerson(pending.id);
                setPending(null);
              }}
            >
              تأكيد
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setPending(null)}>رجوع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PersonRow({
  p,
  settled,
  onSettle,
  onDelete,
}: {
  p: PersonEntry;
  settled?: boolean;
  onSettle?: () => void;
  onDelete?: () => void;
}) {
  const lent = p.direction === "lent";
  return (
    <div className="flex items-center justify-between gap-2 border-b border-dashed border-border py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            lent ? "bg-income/15 text-income" : "bg-destructive/15 text-destructive",
          )}
        >
          {lent ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{p.name}</div>
          <div className="text-xs text-muted-foreground">
            {lent ? "ليه عندك" : "عليك ليه"} · {formatDate(p.date)}
            {p.note ? ` · ${p.note}` : ""}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn("num text-sm font-bold", lent ? "text-income" : "text-destructive")}>
          {money(p.amount)}
        </span>
        {settled ? null : (
          <>
            <Button type="button" variant="ghost" size="icon" className="size-9" onClick={onSettle} aria-label="تقفيل">
              <Check className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground"
              onClick={onDelete}
              aria-label="حذف"
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
