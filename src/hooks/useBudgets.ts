import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MonthlyBudget, IBudgetRepository } from '../types';
import { LocalStorageBudgetRepository } from '../repositories/LocalStorageBudgetRepository';

const START_MONTH_STORAGE_KEY = '@app/budget_start_month';

export function useBudgets(repo?: IBudgetRepository) {
  const repository = useMemo(() => repo || new LocalStorageBudgetRepository(), [repo]);
  const [budgetsMap, setBudgetsMap] = useState<Record<string, MonthlyBudget>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Aggregation starting month (defaults to current year's January e.g. "2026-01")
  const currentYear = new Date().getFullYear();
  const [budgetStartMonth, setBudgetStartMonthState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(START_MONTH_STORAGE_KEY);
      if (saved && /^\d{4}-\d{2}$/.test(saved)) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to read budget start month:', e);
    }
    return `${currentYear}-01`;
  });

  const setBudgetStartMonth = useCallback((ym: string) => {
    setBudgetStartMonthState(ym);
    try {
      localStorage.setItem(START_MONTH_STORAGE_KEY, ym);
    } catch (e) {
      console.error('Failed to save budget start month:', e);
    }
  }, []);

  const loadBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await repository.getAllBudgets();
      setBudgetsMap(data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const updateBudget = useCallback(
    async (budget: MonthlyBudget) => {
      await repository.saveBudget(budget);
      setBudgetsMap((prev) => ({ ...prev, [budget.yearMonth]: budget }));
    },
    [repository]
  );

  return {
    budgetsMap,
    isLoading,
    updateBudget,
    budgetStartMonth,
    setBudgetStartMonth,
    reload: loadBudgets,
  };
}
