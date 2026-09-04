import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TxRow } from "./tx-row";
import { catInfo, useDaftary } from "@/lib/daftary/store";
import { currentMonthKey, formatDate, money, monthLabel } from "@/lib/daftary/format";
import { searchTransactions } from "@/lib/daftary/ledger";
import { cn } from "@/lib/utils";

export function HistoryView() {
  const transactions = useDaftary((s) => s.transactions);
  const categories = useDaftary((s) => s.categories);
  const deleteTx = useDaftary((s) => s.deleteTx);
  const setView = useDaftary((s) => s.setView);
  const setDraft = useDaftary((s) => s.setDraft);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const chips = [
    { id: "all", label: "الكل" },
    { id: "expense", label: "صرف" },
    { id: "income", label: "دخل" },
    { id: "transfer", label: "تحويل" },
    ...categories.map((c) => ({ id: c.id, label: c.label })),
  ];

  const list = useMemo(() => {
    let rows = transactions;
    if (filter === "expense" || filter === "income" || filter === "transfer") {
      rows = rows.filter((t) => t.type === filter);
    } else if (filter !== "all") rows = rows.filter((t) => t.category === filter);
    return searchTransactions(rows, q, categories);
  }, [transactions, filter, q, categories]);

  function exportCsv() {
    if (transactions.length === 0) {
      toast.error("مفيش حركات لتصديرها");
      return;
    }
    let csv = "التاريخ,النوع,الوصف,الفئة,المحفظة,إلى,المبلغ\n";
    [...transactions].reverse().forEach((t) => {
      const kind = t.type === "expense" ? "صرف" : t.type === "income" ? "دخل" : "تحويل";
      csv += `${t.date},${kind},"${t.desc.replace(/"/g, '""')}",${catInfo(categories, t.category).label},${t.wallet},${t.walletTo ?? ""},${t.amount}\n`;
    });
    download(`daftary-${currentMonthKey()}.csv`, "\uFEFF" + csv, "text/csv;charset=utf-8");
    toast.success("تم تنزيل ملف CSV");
  }

  const mk = currentMonthKey();
  const monthRows = transactions.filter((t) => t.date.startsWith(mk));
  const monthTotal = monthRows.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <Input
        className="mb-3"
        placeholder="دور بالوصف أو المبلغ أو المحفظة"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3 text-xs",
              filter === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 no-print">
        <Button type="button" variant="brass" onClick={exportCsv}>
          <FileSpreadsheet className="size-4" />
          تصدير CSV
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          تقرير للطباعة
        </Button>
      </div>
      <Card>
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">مفيش نتائج</p>
        ) : (
          list.map((t) => (
            <TxRow
              key={t.id}
              tx={t}
              categories={categories}
              onDelete={deleteTx}
              onEdit={(tx) => {
                setDraft({
                  id: tx.id,
                  type: tx.type,
                  amount: String(tx.amount),
                  desc: tx.desc,
                  category: tx.category,
                  date: tx.date,
                  wallet: tx.wallet,
                  walletTo: tx.walletTo ?? undefined,
                });
                setView("add");
              }}
            />
          ))
        )}
      </Card>

      <div className="print-only p-6 text-card-foreground">
        <h1 className="font-display text-xl font-bold">دفتري — تقرير {monthLabel()}</h1>
        <p className="mt-1 text-sm">إجمالي الصرف: {money(monthTotal)} ج.م</p>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-border p-2 text-right">التاريخ</th>
              <th className="border border-border p-2 text-right">النوع</th>
              <th className="border border-border p-2 text-right">الفئة</th>
              <th className="border border-border p-2 text-right">الوصف</th>
              <th className="border border-border p-2 text-right">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {[...monthRows].reverse().map((t) => (
              <tr key={t.id}>
                <td className="border border-border p-2">{formatDate(t.date)}</td>
                <td className="border border-border p-2">
                  {t.type === "expense" ? "صرف" : t.type === "income" ? "دخل" : "تحويل"}
                </td>
                <td className="border border-border p-2">{catInfo(categories, t.category).label}</td>
                <td className="border border-border p-2">{t.desc}</td>
                <td className="border border-border p-2">{money(t.amount)} ج.م</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
