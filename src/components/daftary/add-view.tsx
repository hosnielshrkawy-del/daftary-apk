import { useEffect, useState } from "react";
import { Delete, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CatIcon, toneVar } from "./cat-icon";
import { QUICK_AMOUNTS, WALLETS } from "@/lib/daftary/constants";
import { todayIso } from "@/lib/daftary/format";
import { suggestCategory } from "@/lib/daftary/keywords";
import { useDaftary } from "@/lib/daftary/store";
import type { TxType, WalletId } from "@/lib/daftary/types";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

export function AddView() {
  const categories = useDaftary((s) => s.categories);
  const addTx = useDaftary((s) => s.addTx);
  const updateTx = useDaftary((s) => s.updateTx);
  const addRecurring = useDaftary((s) => s.addRecurring);
  const setView = useDaftary((s) => s.setView);
  const draft = useDaftary((s) => s.draft);
  const setDraft = useDaftary((s) => s.setDraft);

  const editingId = draft?.id;
  const [type, setType] = useState<TxType>(draft?.type ?? "expense");
  const [amount, setAmount] = useState(draft?.amount ?? "");
  const [desc, setDesc] = useState(draft?.desc ?? "");
  const [cat, setCat] = useState<string | null>(draft?.category ?? null);
  const [date, setDate] = useState(draft?.date ?? todayIso());
  const [wallet, setWallet] = useState<WalletId>(draft?.wallet ?? "cash");
  const [walletTo, setWalletTo] = useState<WalletId>(draft?.walletTo ?? "vf_cash");
  const [recurring, setRecurring] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [pad, setPad] = useState(!draft?.id);

  useEffect(() => {
    if (!draft?.date && !editingId) setDate(todayIso());
  }, [draft?.date, editingId]);

  function onDesc(v: string) {
    setDesc(v);
    const s = suggestCategory(v);
    if (s && !cat) {
      setCat(s);
      setSuggestion(s);
    } else if (!v) {
      setSuggestion(null);
    }
  }

  function pushKey(k: string) {
    if (k === "del") {
      setAmount((a) => a.slice(0, -1));
      return;
    }
    if (k === "." && amount.includes(".")) return;
    setAmount((a) => (a === "0" && k !== "." ? k : a + k).slice(0, 10));
  }

  function save() {
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      toast.error("من فضلك اكتب مبلغ صحيح");
      return;
    }
    if (type === "transfer") {
      if (wallet === walletTo) {
        toast.error("اختار محفظتين مختلفتين");
        return;
      }
      const payload = {
        amount: n,
        desc: desc.trim() || "تحويل بين المحافظ",
        category: "other",
        date,
        type: "transfer" as const,
        wallet,
        walletTo,
      };
      if (editingId) updateTx(editingId, payload);
      else addTx(payload);
      toast.success("تم التحويل");
      setDraft(null);
      setView("home");
      return;
    }
    if (!desc.trim()) {
      toast.error("اكتب وصف قصير للحركة");
      return;
    }
    if (!cat) {
      toast.error("اختار فئة");
      return;
    }
    if (editingId) {
      updateTx(editingId, {
        amount: n,
        desc: desc.trim(),
        category: cat,
        date,
        type,
        wallet,
        walletTo: null,
      });
      toast.success("تم تعديل الحركة");
    } else {
      let recurringId: string | null = null;
      if (recurring && (type === "expense" || type === "income")) {
        recurringId = addRecurring({
          desc: desc.trim(),
          amount: n,
          category: cat,
          dayOfMonth: new Date(date + "T00:00:00").getDate() || 1,
          type,
          wallet,
        });
      }
      addTx({
        amount: n,
        desc: desc.trim(),
        category: cat,
        date,
        type,
        wallet,
        recurringId,
      });
      toast.success(type === "expense" ? "تم حفظ المصروف" : "تم حفظ الدخل");
    }
    setDraft(null);
    setView("home");
  }

  const visibleCats =
    type === "income"
      ? categories.filter((c) => c.tone === "income" || c.id === "other" || !c.builtin)
      : categories.filter((c) => c.tone !== "income");

  return (
    <Card>
      <CardTitle>{editingId ? "تعديل حركة" : "تسجيل حركة جديدة"}</CardTitle>
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
        {(
          [
            ["expense", "صرف"],
            ["income", "دخل"],
            ["transfer", "تحويل"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn(
              "h-10 rounded-md text-sm font-medium",
              type === id
                ? id === "income"
                  ? "bg-income text-income-foreground"
                  : "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
            onClick={() => setType(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="amount">المبلغ (ج.م)</Label>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-sage"
          onClick={() => setPad((p) => !p)}
        >
          <Keyboard className="size-3" />
          {pad ? "لوحة عادية" : "آلة حاسبة"}
        </button>
      </div>
      <Input
        id="amount"
        type={pad ? "text" : "number"}
        inputMode="decimal"
        placeholder="0"
        value={amount}
        readOnly={pad}
        onChange={(e) => setAmount(e.target.value)}
        className="num text-2xl font-bold"
      />
      {pad ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {KEYS.map((k) => (
            <Button
              key={k}
              type="button"
              variant="outline"
              className="h-12 font-display text-lg"
              onClick={() => pushKey(k)}
              aria-label={k === "del" ? "مسح" : k}
            >
              {k === "del" ? <Delete className="size-5" /> : k}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK_AMOUNTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setAmount(String(n))}
            className="h-8 rounded-full border border-border px-3 text-xs text-muted-foreground"
          >
            {n}
          </button>
        ))}
      </div>

      {type !== "transfer" ? (
        <div className="mt-3">
          <Label htmlFor="desc">الوصف</Label>
          <Input
            id="desc"
            placeholder="مثال: أكلت فول وطعمية"
            value={desc}
            onChange={(e) => onDesc(e.target.value)}
          />
          {suggestion ? (
            <p className="mt-2 text-xs text-sage">
              اقتراح تصنيف: {categories.find((c) => c.id === suggestion)?.label} — تقدر تغيّره
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3">
          <Label htmlFor="tdesc">ملاحظة (اختياري)</Label>
          <Input
            id="tdesc"
            placeholder="تحويل لمصروف الأسبوع"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
      )}

      {type !== "transfer" ? (
        <div className="mt-3">
          <Label>الفئة</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {visibleCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn(
                  "flex min-h-11 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs",
                  cat === c.id
                    ? "border-accent bg-accent/10 font-bold text-card-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <span style={{ color: toneVar(c.tone) }}>
                  <CatIcon name={c.icon} />
                </span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <Label>{type === "transfer" ? "من محفظة" : "المحفظة"}</Label>
        <WalletChips value={wallet} onChange={setWallet} />
      </div>
      {type === "transfer" ? (
        <div className="mt-3">
          <Label>إلى محفظة</Label>
          <WalletChips value={walletTo} onChange={setWalletTo} />
        </div>
      ) : null}

      <div className="mt-3">
        <Label htmlFor="date">التاريخ</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {!editingId && type !== "transfer" ? (
        <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-card-foreground">
          <input
            type="checkbox"
            className="size-4 accent-accent"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          حركة ثابتة تتكرر كل شهر
        </label>
      ) : null}

      <Button type="button" className="mt-5 w-full" onClick={save}>
        {editingId ? "حفظ التعديل" : "حفظ"}
      </Button>
      {editingId ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => {
            setDraft(null);
            setView("history");
          }}
        >
          إلغاء
        </Button>
      ) : null}
    </Card>
  );
}

function WalletChips({
  value,
  onChange,
}: {
  value: WalletId;
  onChange: (id: WalletId) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {WALLETS.map((w) => (
        <button
          key={w.id}
          type="button"
          onClick={() => onChange(w.id)}
          className={cn(
            "h-9 rounded-full border px-3 text-xs",
            value === w.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground",
          )}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
