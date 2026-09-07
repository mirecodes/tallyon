import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MonthlyBudget, IBudgetRepository } from '../types';
import { LocalStorageBudgetRepository } from '../repositories/LocalStorageBudgetRepository';

export function useBudgets(repo?: IBudgetRepository) {
  const repository = useMemo(() => repo || new LocalStorageBudgetRepository(), [repo]);
  const [budgetsMap, setBudgetsMap] = useState<Record<string, MonthlyBudget>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
    reload: loadBudgets,
  };
}
