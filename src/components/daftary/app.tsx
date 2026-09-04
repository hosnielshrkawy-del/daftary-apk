import { useEffect } from "react";
import { BookMarked, Home, Moon, Plus, ScrollText, Sun, Target, Users } from "lucide-react";
import { toast, Toaster } from "sonner";
import { HomeView } from "./home-view";
import { AddView } from "./add-view";
import { HistoryView } from "./history-view";
import { BudgetView } from "./budget-view";
import { PeopleView } from "./people-view";
import { MoreView } from "./more-view";
import { LockScreen } from "./lock-screen";
import { Onboarding } from "./onboarding";
import { Button } from "@/components/ui/button";
import { monthLabel } from "@/lib/daftary/format";
import { useDaftary } from "@/lib/daftary/store";
import type { ViewId } from "@/lib/daftary/types";
import { cn } from "@/lib/utils";

const NAV: { id: ViewId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "history", label: "السجل", icon: ScrollText },
  { id: "people", label: "الناس", icon: Users },
  { id: "budget", label: "ميزانية", icon: Target },
  { id: "more", label: "المزيد", icon: BookMarked },
];

export function DaftaryApp() {
  const hydrated = useDaftary((s) => s.hydrated);
  const unlocked = useDaftary((s) => s.unlocked);
  const onboarded = useDaftary((s) => s.onboarded);
  const hydrate = useDaftary((s) => s.hydrate);
  const view = useDaftary((s) => s.view);
  const setView = useDaftary((s) => s.setView);
  const theme = useDaftary((s) => s.theme);
  const toggleTheme = useDaftary((s) => s.toggleTheme);
  const lastDeleted = useDaftary((s) => s.lastDeleted);
  const undoDelete = useDaftary((s) => s.undoDelete);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!lastDeleted) return;
    toast("اتمسحت الحركة", {
      id: `del-${lastDeleted.id}`,
      action: {
        label: "تراجع",
        onClick: () => undoDelete(),
      },
    });
  }, [lastDeleted, undoDelete]);

  if (!hydrated) {
    return (
      <div className="app-cover flex min-h-dvh items-center justify-center">
        <div className="font-display text-2xl font-extrabold tracking-wide text-foreground">
          دفتر<span className="text-accent">ي</span>
        </div>
      </div>
    );
  }

  if (!unlocked) return <LockScreen />;
  if (!onboarded) return <Onboarding />;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="app-cover no-print relative px-5 pt-6 pb-7">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="font-display text-2xl font-extrabold tracking-wide">
              دفتر<span className="text-accent">ي</span>
            </div>
            <div className="mt-0.5 text-xs text-sage">كناشك الرقمي لمتابعة فلوسك</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-foreground/20 px-3 py-1 text-xs">
              {monthLabel()}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-full border border-foreground/20"
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="view-enter mx-auto max-w-lg px-4 py-4 pb-28">
        {view === "home" ? <HomeView /> : null}
        {view === "add" ? <AddView /> : null}
        {view === "history" ? <HistoryView /> : null}
        {view === "people" ? <PeopleView /> : null}
        {view === "budget" ? <BudgetView /> : null}
        {view === "more" ? <MoreView /> : null}
      </main>

      {view !== "add" ? (
        <button
          type="button"
          onClick={() => setView("add")}
          className="no-print fixed bottom-20 left-1/2 z-20 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-card)] transition-transform duration-150 ease-out active:scale-[0.96]"
          aria-label="حركة جديدة"
        >
          <Plus className="size-7" strokeWidth={2} />
        </button>
      ) : null}

      <nav className="no-print fixed inset-x-0 bottom-0 z-10 flex justify-around bg-background px-1 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(16_40_35_/_0.25)]">
        {NAV.map((n) => {
          const active = view === n.id;
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setView(n.id)}
              className={cn(
                "flex min-h-11 flex-1 flex-col items-center gap-0.5 text-xs transition-colors duration-150",
                active ? "text-accent" : "text-sage",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
              {n.label}
            </button>
          );
        })}
      </nav>
      <Toaster richColors position="top-center" dir="rtl" />
    </div>
  );
}
