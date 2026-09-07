import type { MonthlyBudget, IBudgetRepository, DbMonthlyBudget } from '../types';
import { supabase, isSupabaseConfigured, ensureAuthUser } from '../services/supabase';
import { LocalStorageBudgetRepository } from './LocalStorageBudgetRepository';

export class SupabaseBudgetRepository implements IBudgetRepository {
  private fallbackRepo = new LocalStorageBudgetRepository();

  async getBudget(yearMonth: string): Promise<MonthlyBudget | null> {
    if (!isSupabaseConfigured || !supabase) {
      return this.fallbackRepo.getBudget(yearMonth);
    }

    try {
      const userId = await ensureAuthUser();
      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('year_month', yearMonth)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return this.fallbackRepo.getBudget(yearMonth);
      }

      const row = data as DbMonthlyBudget;
      return {
        yearMonth: row.year_month,
        baseBudget: Number(row.base_budget),
        extraBudget: Number(row.extra_budget),
        totalBudget: Number(row.base_budget) + Number(row.extra_budget),
        currency: row.currency,
        updatedAt: row.updated_at,
      };
    } catch (err) {
      console.warn('Supabase getBudget failed, falling back to LocalStorage:', err);
      return this.fallbackRepo.getBudget(yearMonth);
    }
  }

  async getAllBudgets(): Promise<Record<string, MonthlyBudget>> {
    if (!isSupabaseConfigured || !supabase) {
      return this.fallbackRepo.getAllBudgets();
    }

    try {
      const userId = await ensureAuthUser();
      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!data || data.length === 0) {
        return this.fallbackRepo.getAllBudgets();
      }

      const map: Record<string, MonthlyBudget> = {};
      for (const item of data as DbMonthlyBudget[]) {
        map[item.year_month] = {
          yearMonth: item.year_month,
          baseBudget: Number(item.base_budget),
          extraBudget: Number(item.extra_budget),
          totalBudget: Number(item.base_budget) + Number(item.extra_budget),
          currency: item.currency,
          updatedAt: item.updated_at,
        };
      }
      return map;
    } catch (err) {
      console.warn('Supabase getAllBudgets failed, falling back to LocalStorage:', err);
      return this.fallbackRepo.getAllBudgets();
    }
  }

  async saveBudget(budget: MonthlyBudget): Promise<void> {
    // Keep local cache updated
    await this.fallbackRepo.saveBudget(budget);

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      const userId = await ensureAuthUser();
      const payload: Omit<DbMonthlyBudget, 'id'> = {
        user_id: userId,
        year_month: budget.yearMonth,
        base_budget: budget.baseBudget,
        extra_budget: budget.extraBudget,
        currency: budget.currency,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('monthly_budgets')
        .upsert(payload, { onConflict: 'user_id, year_month' });

      if (error) throw error;
    } catch (err) {
      console.warn('Supabase saveBudget failed, saved in LocalStorage:', err);
    }
  }
}
