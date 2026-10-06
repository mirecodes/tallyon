// Self-check for fixed-expense projection. Run: node src/utils/fixedExpenses.check.ts
import type { Transaction } from '../types';
import { scopeAll, scopeMonth } from './fixedExpenses.ts';

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
};
const local = (y: number, m: number, d: number, h = 9, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
const tx = (p: Partial<Transaction> & Pick<Transaction, 'id' | 'transactionTime'>): Transaction => ({
  description: 'Rent', originalAmount: 100, originalCurrency: 'CHF', category: 'Housing',
  expenseNature: 'RECURRING_MONTHLY', isFixed: true, createdAt: '', updatedAt: '', ...p,
});

const root = tx({ id: 'root', transactionTime: local(2026, 1, 31, 8, 15) });

// Only Fixed + Monthly repeats
ok(scopeMonth([tx({ id: 'a', transactionTime: local(2026, 1, 5), isFixed: false })], '2026-02').length === 0, 'non-fixed monthly must not repeat');
ok(scopeMonth([tx({ id: 'b', transactionTime: local(2026, 1, 5), expenseNature: 'ONE_OFF' })], '2026-02').length === 0, 'fixed one-off must not repeat');

// Day clamp + time preserved
const feb = scopeMonth([root], '2026-02');
ok(feb.length === 1 && new Date(feb[0].transactionTime).getDate() === 28, 'Jan 31 clamps to Feb 28');
ok(new Date(feb[0].transactionTime).getHours() === 8 && new Date(feb[0].transactionTime).getMinutes() === 15, 'time copied');

// Edit in March propagates to April+, February still uses root
const marEdit = tx({ id: 'mar', parentFixedId: 'root', transactionTime: local(2026, 3, 10, 20, 0), originalAmount: 150 });
const data = [root, marEdit];
ok(scopeMonth(data, '2026-02')[0].originalAmount === 100, 'Feb from root');
ok(scopeMonth(data, '2026-03').length === 1 && scopeMonth(data, '2026-03')[0].id === 'mar', 'Mar shows real edit only');
const apr = scopeMonth(data, '2026-04');
ok(apr.length === 1 && apr[0].originalAmount === 150 && new Date(apr[0].transactionTime).getDate() === 10, 'Apr copies latest edit');
ok(new Date(apr[0].transactionTime).getHours() === 20, 'Apr copies edited time');

// Stopping any member stops the whole lineage
const stopped = [root, { ...marEdit, stoppedAfterMonth: '2026-05' }];
ok(scopeMonth(stopped, '2026-04').length === 1 && scopeMonth(stopped, '2026-05').length === 0, 'lineage stop');

// ALL: real entries + carry-overs through untilYM
ok(scopeAll(data, '2026-04').length === 4, 'ALL = Jan root + Feb proj + Mar edit + Apr proj');

console.log('fixedExpenses: all checks passed');
