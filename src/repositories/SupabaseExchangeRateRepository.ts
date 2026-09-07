import type { ExchangeRateRecord, IExchangeRateRepository, DbExchangeRate } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { LocalStorageExchangeRateRepository } from './LocalStorageExchangeRateRepository';

export class SupabaseExchangeRateRepository implements IExchangeRateRepository {
  private fallbackRepo = new LocalStorageExchangeRateRepository();

  async getRates(date: string): Promise<ExchangeRateRecord | null> {
    if (!isSupabaseConfigured || !supabase) {
      return this.fallbackRepo.getRates(date);
    }

    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('rate_date', date)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return this.fallbackRepo.getRates(date);
      }

      const row = data as DbExchangeRate;
      return {
        date: row.rate_date,
        baseCurrency: 'KRW',
        rates: row.rates,
        updatedAt: row.updated_at,
      };
    } catch (err) {
      console.warn('Supabase getRates failed, falling back to LocalStorage:', err);
      return this.fallbackRepo.getRates(date);
    }
  }

  async getRatesBatch(dates: string[]): Promise<Record<string, ExchangeRateRecord>> {
    if (!isSupabaseConfigured || !supabase || dates.length === 0) {
      return this.fallbackRepo.getRatesBatch(dates);
    }

    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .in('rate_date', dates);

      if (error) throw error;
      const result: Record<string, ExchangeRateRecord> = {};

      if (data) {
        for (const row of data as DbExchangeRate[]) {
          result[row.rate_date] = {
            date: row.rate_date,
            baseCurrency: 'KRW',
            rates: row.rates,
            updatedAt: row.updated_at,
          };
        }
      }

      // Check missing dates from fallback
      const missingDates = dates.filter((d) => !result[d]);
      if (missingDates.length > 0) {
        const localBatch = await this.fallbackRepo.getRatesBatch(missingDates);
        Object.assign(result, localBatch);
      }

      return result;
    } catch (err) {
      console.warn('Supabase getRatesBatch failed, falling back to LocalStorage:', err);
      return this.fallbackRepo.getRatesBatch(dates);
    }
  }

  async saveRates(record: ExchangeRateRecord): Promise<void> {
    await this.fallbackRepo.saveRates(record);

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      const payload: DbExchangeRate = {
        rate_date: record.date,
        base_currency: 'KRW',
        rates: record.rates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('exchange_rates')
        .upsert(payload, { onConflict: 'rate_date' });

      if (error) throw error;
    } catch (err) {
      // Rates table might be read-only under anon role without admin key, which is expected
      console.warn('Supabase saveRates skipped or failed (falling back to LocalStorage):', err);
    }
  }

  async getLatestAvailableRate(targetDate: string): Promise<ExchangeRateRecord | null> {
    if (!isSupabaseConfigured || !supabase) {
      return this.fallbackRepo.getLatestAvailableRate(targetDate);
    }

    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .lte('rate_date', targetDate)
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const row = data as DbExchangeRate;
        return {
          date: row.rate_date,
          baseCurrency: 'KRW',
          rates: row.rates,
          updatedAt: row.updated_at,
        };
      }

      return this.fallbackRepo.getLatestAvailableRate(targetDate);
    } catch (err) {
      return this.fallbackRepo.getLatestAvailableRate(targetDate);
    }
  }
}
