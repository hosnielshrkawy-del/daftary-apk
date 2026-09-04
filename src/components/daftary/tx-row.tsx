import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { catInfo } from "@/lib/daftary/store";
import { formatDate, money, walletLabel } from "@/lib/daftary/format";
import type { Category, Transaction } from "@/lib/daftary/types";
import { CatIcon, toneVar } from "./cat-icon";
import { Button } from "@/components/ui/button";

export function TxRow({
  tx,
  categories,
  onDelete,
  onEdit,
  compact,
}: {
  tx: Transaction;
  categories: Category[];
  onDelete?: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
  compact?: boolean;
}) {
  const transfer = tx.type === "transfer";
  const c = catInfo(categories, transfer ? "other" : tx.category);
  const expense = tx.type === "expense";
  const sign = transfer ? "" : expense ? "−" : "+";
  const color = transfer ? "text-card-foreground" : expense ? "text-destructive" : "text-income";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-border py-3 last:border-b-0">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-right"
        onClick={() => onEdit?.(tx)}
      >
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in srgb, ${toneVar(c.tone)} 18%, transparent)`,
            color: toneVar(c.tone),
          }}
        >
          {transfer ? <ArrowLeftRight className="size-4" /> : <CatIcon name={c.icon} />}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{tx.desc}</div>
          <div className="text-xs text-muted-foreground">
            {transfer
              ? `${walletLabel(tx.wallet)} ← ${walletLabel(tx.walletTo ?? tx.wallet)}`
              : c.label}
            {" · "}
            {formatDate(tx.date)}
            {compact || transfer ? null : ` · ${walletLabel(tx.wallet)}`}
          </div>
        </div>
      </button>
      <div className="flex items-center gap-0.5">
        <div className={`num text-sm font-bold ${color}`}>
          {sign}
          {money(tx.amount)}
        </div>
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground"
            onClick={() => onEdit(tx)}
            aria-label="تعديل"
          >
            <Pencil className="size-4" />
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground"
            onClick={() => onDelete(tx.id)}
            aria-label="حذف"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
