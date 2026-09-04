import { daysInMonth } from "@/lib/daftary/format";
import { WEEKDAYS_AR } from "@/lib/daftary/constants";
import { cn } from "@/lib/utils";

export function MonthHeatmap({
  monthKey,
  daily,
}: {
  monthKey: string;
  daily: Record<string, number>;
}) {
  const [ys, ms] = monthKey.split("-");
  const year = Number(ys);
  const month = Number(ms);
  const first = new Date(year, month - 1, 1);
  const dim = daysInMonth(first);
  const startDow = first.getDay();
  const max = Math.max(1, ...Object.values(daily));
  const cells: Array<{ d: number; v: number } | null> = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) {
    const key = `${monthKey}-${String(d).padStart(2, "0")}`;
    cells.push({ d, v: daily[key] || 0 });
  }

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {WEEKDAYS_AR.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <span key={`e${i}`} />;
          const t = c.v / max;
          return (
            <div
              key={c.d}
              title={`${c.d}: ${c.v}`}
              className={cn(
                "heat-cell flex aspect-square items-center justify-center rounded-md text-[10px] font-medium",
                c.v === 0 ? "bg-secondary text-muted-foreground" : "text-accent-foreground",
              )}
              style={
                c.v > 0
                  ? {
                      background: `color-mix(in srgb, var(--color-accent) ${Math.round(28 + t * 72)}%, var(--color-secondary))`,
                    }
                  : undefined
              }
            >
              {c.d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
