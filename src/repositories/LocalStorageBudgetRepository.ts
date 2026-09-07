import type { MonthlyBudget, IBudgetRepository } from '../types';

const STORAGE_KEY = '@app/budgets';

// Default initial budgets (realistic defaults in KRW)
const DEFAULT_BUDGETS: Record<string, MonthlyBudget> = {
  '2026-09': {
    yearMonth: '2026-09',
    totalBudget: 3000000,
    currency: 'KRW',
    categoryBudgets: {
      Groceries: 500000,
      'Food & Dining': 400000,
      Transport: 250000,
      'Housing & Utilities': 1200000,
      Subscriptions: 100000,
      'Education & Books': 200000,
      Shopping: 200000,
      Other: 150000,
    },
    updatedAt: new Date().toISOString(),
  },
};

export class LocalStorageBudgetRepository implements IBudgetRepository {
  private readStorage(): Record<string, MonthlyBudget> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BUDGETS));
        return DEFAULT_BUDGETS;
      }
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read budgets from LocalStorage:', err);
      return DEFAULT_BUDGETS;
    }
  }

  private writeStorage(map: Record<string, MonthlyBudget>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (err) {
      console.error('Failed to write budgets to LocalStorage:', err);
    }
  }

  async getBudget(yearMonth: string): Promise<MonthlyBudget | null> {
    const map = this.readStorage();
    if (map[yearMonth]) {
      return map[yearMonth];
    }
    // If not set yet, fallback with default 3,000,000 KRW
    return {
      yearMonth,
      totalBudget: 3000000,
      currency: 'KRW',
      categoryBudgets: {},
      updatedAt: new Date().toISOString(),
    };
  }

  async getAllBudgets(): Promise<Record<string, MonthlyBudget>> {
    return this.readStorage();
  }

  async saveBudget(budget: MonthlyBudget): Promise<void> {
    const map = this.readStorage();
    map[budget.yearMonth] = budget;
    this.writeStorage(map);
  }
}
