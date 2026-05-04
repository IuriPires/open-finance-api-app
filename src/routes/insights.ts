import { Router } from 'express';
import { pluggy } from '../pluggy-client.js';
import type { Transaction } from 'pluggy-sdk';

export const insightsRouter = Router();

type CategoryAggregate = {
  prefix: string;
  total: number;
  count: number;
};

function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error('month must be in YYYY-MM format');
  }
  return { year, month };
}

function monthBounds(yearMonth: string): { from: string; to: string } {
  const { year, month } = parseYearMonth(yearMonth);
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

function previousMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  const prev = new Date(year, month - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

function aggregateByCategory(transactions: Transaction[]): {
  byCategory: CategoryAggregate[];
  totalSpent: number;
} {
  const map = new Map<string, CategoryAggregate>();
  let totalSpent = 0;

  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const prefix = tx.categoryId ? tx.categoryId.slice(0, 2) : 'unknown';
    const abs = Math.abs(tx.amount);
    totalSpent += abs;
    const existing = map.get(prefix);
    if (existing) {
      existing.total += abs;
      existing.count += 1;
    } else {
      map.set(prefix, { prefix, total: abs, count: 1 });
    }
  }

  const byCategory = [...map.values()].sort((a, b) => b.total - a.total);
  return { byCategory, totalSpent };
}

async function fetchAllItemTransactions(
  itemId: string,
  from: string,
  to: string,
): Promise<Transaction[]> {
  const accountsPage = await pluggy.fetchAccounts(itemId);
  const all: Transaction[] = [];
  for (const account of accountsPage.results) {
    const page = await pluggy.fetchTransactions(account.id, { from, to, pageSize: 500 });
    all.push(...page.results);
  }
  return all;
}

insightsRouter.get('/items/:id/insights', async (req, res, next) => {
  try {
    const month =
      typeof req.query.month === 'string'
        ? req.query.month
        : new Date().toISOString().slice(0, 7);

    const { from, to } = monthBounds(month);
    const prevMonth = previousMonth(month);
    const { from: prevFrom, to: prevTo } = monthBounds(prevMonth);

    const [currentTx, prevTx] = await Promise.all([
      fetchAllItemTransactions(req.params.id, from, to),
      fetchAllItemTransactions(req.params.id, prevFrom, prevTo),
    ]);

    const current = aggregateByCategory(currentTx);
    const previous = aggregateByCategory(prevTx);

    const previousMap = new Map(previous.byCategory.map((c) => [c.prefix, c.total]));
    const enrichedCurrent = current.byCategory.map((c) => {
      const prevTotal = previousMap.get(c.prefix) ?? 0;
      const delta = prevTotal > 0 ? ((c.total - prevTotal) / prevTotal) * 100 : null;
      return { ...c, previousTotal: prevTotal, deltaPct: delta };
    });

    res.json({
      month,
      previousMonth: prevMonth,
      totalSpent: current.totalSpent,
      previousTotalSpent: previous.totalSpent,
      categories: enrichedCurrent,
    });
  } catch (err) {
    next(err);
  }
});
