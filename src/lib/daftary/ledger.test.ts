import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyData } from "./storage.ts";
import {
  applyRecurring,
  dailyPace,
  monthEarned,
  monthSpent,
  netWorth,
  reverseSideEffects,
  searchTransactions,
  walletBalances,
} from "./ledger.ts";
import { normalize, parseBackup, toBackupJson } from "./storage.ts";
import { suggestCategory } from "./keywords.ts";
import { buildInsights } from "./insights.ts";
import { DEFAULT_CATEGORIES } from "./constants.ts";

describe("walletBalances", () => {
  it("applies opening, income, expense and transfer", () => {
    const data = emptyData();
    data.openingBalances.cash = 100;
    data.openingBalances.bank = 500;
    data.transactions = [
      {
        id: "1",
        amount: 50,
        desc: "فول",
        category: "food",
        date: "2026-09-01",
        type: "expense",
        wallet: "cash",
      },
      {
        id: "2",
        amount: 200,
        desc: "راتب",
        category: "salary",
        date: "2026-09-01",
        type: "income",
        wallet: "bank",
      },
      {
        id: "3",
        amount: 80,
        desc: "تحويل",
        category: "other",
        date: "2026-09-02",
        type: "transfer",
        wallet: "bank",
        walletTo: "cash",
      },
    ];
    const bal = walletBalances(data);
    assert.equal(bal.cash, 130);
    assert.equal(bal.bank, 620);
    assert.equal(netWorth(bal), 750);
  });
});

describe("recurring", () => {
  it("posts once per month", () => {
    const data = emptyData();
    data.recurring = [
      {
        id: "r1",
        desc: "إيجار",
        amount: 3000,
        category: "bills",
        dayOfMonth: 1,
        type: "expense",
        wallet: "bank",
      },
    ];
    const once = applyRecurring(data, "2026-09");
    assert.equal(once.transactions.length, 1);
    assert.equal(once.transactions[0].date, "2026-09-01");
    const twice = applyRecurring(once, "2026-09");
    assert.equal(twice.transactions.length, 1);
    const next = applyRecurring(once, "2026-10");
    assert.equal(next.transactions.length, 2);
  });
});

describe("search and month totals", () => {
  it("finds by desc, wallet, amount", () => {
    const list = [
      {
        id: "1",
        amount: 45,
        desc: "أوبر للشغل",
        category: "transport",
        date: "2026-09-03",
        type: "expense" as const,
        wallet: "instapay" as const,
      },
    ];
    assert.equal(searchTransactions(list, "أوبر", DEFAULT_CATEGORIES).length, 1);
    assert.equal(searchTransactions(list, "إنستاباي", DEFAULT_CATEGORIES).length, 1);
    assert.equal(searchTransactions(list, "45", DEFAULT_CATEGORIES).length, 1);
    assert.equal(searchTransactions(list, "بيتزا", DEFAULT_CATEGORIES).length, 0);
    assert.equal(monthSpent(list, "2026-09"), 45);
    assert.equal(monthEarned(list, "2026-09"), 0);
  });
});

describe("goal reverse", () => {
  it("undoes savings when the tx is removed", () => {
    const data = emptyData();
    data.goals = [{ id: "g1", name: "لابتوب", target: 10000, saved: 500 }];
    const tx = {
      id: "t1",
      amount: 200,
      desc: "ادخار",
      category: "savings",
      date: "2026-09-04",
      type: "expense" as const,
      wallet: "cash" as const,
      goalId: "g1",
    };
    data.transactions = [tx];
    const next = reverseSideEffects(data, tx);
    assert.equal(next.goals[0].saved, 300);
  });
});

describe("pace", () => {
  it("splits remaining budget across leftover days", () => {
    const now = new Date(2026, 8, 20);
    const pace = dailyPace(2000, 5000, now);
    assert.ok(pace);
    assert.equal(pace!.leftDays, 11);
    assert.ok(Math.abs(pace!.perDay - 3000 / 11) < 0.01);
    assert.equal(pace!.over, false);
  });
});

describe("backup migrate", () => {
  it("upgrades v2 payload and strips pin", () => {
    const raw = toBackupJson(
      normalize({
        version: 2 as unknown as 3,
        transactions: [],
        pin: { salt: "aa", hash: "bb", algo: "sha256" },
      }),
    );
    const parsed = parseBackup(raw);
    assert.equal(parsed.version, 3);
    assert.equal(parsed.pin, null);
    assert.ok(parsed.categories.some((c) => c.id === "savings"));
  });
});

describe("keywords", () => {
  it("suggests egyptian food and ride hailing", () => {
    assert.equal(suggestCategory("أكلت فول وطعمية"), "food");
    assert.equal(suggestCategory("أوبر للشغل"), "transport");
    assert.equal(suggestCategory("راتب سبتمبر"), "salary");
  });
});

describe("insights", () => {
  it("flags the dominant category", () => {
    const tx = [
      {
        id: "1",
        amount: 80,
        desc: "فول",
        category: "food",
        date: "2026-09-01",
        type: "expense" as const,
        wallet: "cash" as const,
      },
      {
        id: "2",
        amount: 20,
        desc: "مترو",
        category: "transport",
        date: "2026-09-02",
        type: "expense" as const,
        wallet: "cash" as const,
      },
    ];
    const msgs = buildInsights(tx, 1000, 0, DEFAULT_CATEGORIES, new Date(2026, 8, 10));
    assert.ok(msgs.some((m) => m.includes("أكل")));
  });
});
