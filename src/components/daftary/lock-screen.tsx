import { useState } from "react";
import { Delete, Notebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDaftary } from "@/lib/daftary/store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function LockScreen() {
  const unlock = useDaftary((s) => s.unlock);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  async function push(k: string) {
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      setError(false);
      return;
    }
    if (!k || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      const ok = await unlock(next);
      if (!ok) {
        setError(true);
        setPin("");
      }
    }
  }

  return (
    <div className="app-cover flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Notebook className="size-7" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide">
          دفتر<span className="text-accent">ي</span>
        </h1>
        <p className="mt-2 text-sm text-sage">اكتب الرقم السري عشان تفتح الدفتر</p>
      </div>
      <div className="mb-6 flex gap-3" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`size-3 rounded-full border border-accent ${
              i < pin.length ? "bg-accent" : "bg-transparent"
            } ${error ? "border-destructive" : ""}`}
          />
        ))}
      </div>
      {error ? <p className="mb-4 text-sm text-destructive">الرقم مش صح، جرّب تاني</p> : null}
      <div className="grid w-full max-w-xs grid-cols-3 gap-2">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <Button
              key={i}
              type="button"
              variant="ghost"
              className="h-14 font-display text-xl text-foreground hover:bg-foreground/10"
              onClick={() => push(k)}
              aria-label={k === "del" ? "مسح" : k}
            >
              {k === "del" ? <Delete className="size-5" /> : k}
            </Button>
          ),
        )}
      </div>
    </div>
  );
}
