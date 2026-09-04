import { useState } from "react";
import { BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPTY_WALLETS, WALLETS } from "@/lib/daftary/constants";
import { useDaftary } from "@/lib/daftary/store";
import type { OpeningBalances } from "@/lib/daftary/types";

export function Onboarding() {
  const completeOnboarding = useDaftary((s) => s.completeOnboarding);
  const loadDemo = useDaftary((s) => s.loadDemo);
  const [step, setStep] = useState(0);
  const [opening, setOpening] = useState<OpeningBalances>({ ...EMPTY_WALLETS });
  const [budget, setBudget] = useState("");

  if (step === 0) {
    return (
      <div className="app-cover flex min-h-dvh flex-col items-center justify-center px-6 py-10">
        <div className="view-enter w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <BookMarked className="size-8" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-wide">
            دفتر<span className="text-accent">ي</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-sage">
            كناشك الرقمي. المصروف، السلف، الجمعية، والمحفظة — على جهازك، من غير حساب.
          </p>
          <Button type="button" className="mt-8 w-full" onClick={() => setStep(1)}>
            ابدأ الدفتر
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full text-sage"
            onClick={loadDemo}
          >
            افتح دفتر تجريبي الأول
          </Button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-dvh bg-background px-4 py-8 text-foreground">
        <div className="view-enter mx-auto max-w-sm">
          <p className="text-xs text-sage">٢ من ٣</p>
          <h2 className="font-display mt-1 text-2xl font-bold">أرصدة المحافظ</h2>
          <p className="mt-1 text-sm text-sage">كام معاك دلوقتي؟ تقدر تسيبهم صفر وتعدّل بعدين.</p>
          <Card className="mt-5 space-y-3">
            {WALLETS.map((w) => (
              <div key={w.id}>
                <Label htmlFor={w.id}>
                  {w.label} <span className="text-muted-foreground">· {w.hint}</span>
                </Label>
                <Input
                  id={w.id}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={opening[w.id] || ""}
                  onChange={(e) =>
                    setOpening({ ...opening, [w.id]: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            ))}
          </Card>
          <Button type="button" className="mt-5 w-full" onClick={() => setStep(2)}>
            التالي
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="view-enter mx-auto max-w-sm">
        <p className="text-xs text-sage">٣ من ٣</p>
        <h2 className="font-display mt-1 text-2xl font-bold">ميزانية الشهر</h2>
        <p className="mt-1 text-sm text-sage">اختياري. دفتري هيحسب لك كام يتصرف في اليوم.</p>
        <Card className="mt-5">
          <Label htmlFor="ob-budget">الميزانية بالجنيه</Label>
          <Input
            id="ob-budget"
            type="number"
            inputMode="decimal"
            placeholder="مثال: 5000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </Card>
        <Button
          type="button"
          className="mt-5 w-full"
          onClick={() => completeOnboarding(opening, parseFloat(budget) || undefined)}
        >
          ادخل الدفتر
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full text-sage"
          onClick={() => completeOnboarding(opening)}
        >
          تخطّي الميزانية
        </Button>
      </div>
    </div>
  );
}
