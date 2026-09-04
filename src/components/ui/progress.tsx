import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-foreground/15", className)}>
      <div
        className={cn("h-full rounded-full bg-accent transition-[width] duration-300", indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
